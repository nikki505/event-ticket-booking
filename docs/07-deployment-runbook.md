# 7. Deployment Runbook (EC2)

**Project:** Event Ticket Booking System
**Student:** Nikhittha Mukkala (N12202665)

CI/CD is out of scope per the brief, so this deployment is manual. This document is the
written procedure required by US-15 AC5: someone unfamiliar with the project should be able
to follow it and redeploy without asking me anything.

---

## 7.1 What was deployed

| Item | Value |
|---|---|
| **AWS account** | 438807478932 (`qut-aws-learn-teach-5`) |
| **Region** | ap-southeast-2 (Sydney) |
| **Role** | IFN636-STUDENT (via SSO) |
| **Instance ID** | `i-04a1250e9732b2449` |
| **Instance name tag** | `n12202665-nikhittha-eventtix` |
| **Instance type** | t3.micro |
| **AMI** | `ami-09e887124d6ee3bb9` (Amazon Linux 2023) |
| **Availability zone** | ap-southeast-2a |
| **Subnet** | `subnet-01b6baa7effb222fc` (aws-controltower-PublicSubnet1) |
| **VPC** | `vpc-01db62f7487ef8207` (aws-controltower-VPC) |
| **Security group** | `sg-0cc12e170c4f78181` (student-allowed-sg-7) |
| **Key pair** | `n12202665-eventtix-key` |
| **Public IP** | 32.236.117.199 |
| **Public URL** | http://32.236.117.199 |
| **Storage** | 16 GB gp3, deleted on termination |

---

## 7.2 Constraints in this account, and what they forced

This is a **shared teaching account**. At deployment time it held 169 instances belonging to
other students. Two restrictions shaped the design of this deployment, and both are worth
stating because they are the reason some choices look unusual.

### There is no default VPC

`describe-vpcs` returns no VPC with `IsDefault=true`, so the subnet has to be named
explicitly at launch. `aws-controltower-PublicSubnet1` was chosen because it has
`MapPublicIpOnLaunch=true`, which is what gives the instance a public address.

### Students cannot create security groups

```
An error occurred (UnauthorizedOperation) when calling the CreateSecurityGroup operation:
... with an explicit deny in an identity-based policy:
arn:aws:iam::438807478932:policy/Do-Not-Delete-LT5-DenyPolicy-1
```

The deny applies in every VPC in the account, so a purpose-built security group for this
project is impossible. The only option is one of eight pre-existing `student-allowed-sg-*`
groups, each already attached to between 30 and 134 other students' instances.

`student-allowed-sg-7` was chosen because it was the least used (30 instances) and had **no
port 80 rules at all**, so adding one disturbs the fewest people.

**Consequence for security hygiene (N6).** Because the group is shared, a rule added for
this project applies to every instance using it. Port 80 was therefore opened to a single
`/32`, the developer machine, rather than to `0.0.0.0/0`. Opening it to the world would have
exposed port 80 on roughly 30 other students' instances to the entire internet without their
knowledge, which is not a defensible thing to do to shared infrastructure for the sake of
one assignment.

**This is an open item, not a solved one.** See §7.7.

---

## 7.3 Security posture

| Port | Source | Why |
|---|---|---|
| 80 | `1.132.104.252/32` | The developer machine only. See §7.7 for marking access. |
| 22 | `1.132.104.252/32` | SSH from the developer machine only, never `0.0.0.0/0`. |
| 27017 | **not open** | MongoDB binds to `127.0.0.1` inside the instance, so the database is unreachable from outside even though it shares the host. |

Other rules visible on this group belong to other students and were not touched.

Additional measures:

- The **JWT secret is generated on the instance** at first boot with `openssl rand -hex 48`.
  It is never in the repository, never in the bootstrap script, and never passed on a
  command line. `.env` is written with mode `600`.
- **No secret is committed.** `.gitignore` was the very first commit in the repository
  precisely so that no credential could ever enter the history.
- **nginx is the only public listener.** Node listens on 5000 bound behind the proxy, so
  there is one way in rather than two.

---

## 7.4 How the deployment works

The instance is launched with `deploy/user-data.sh` as user data, which cloud-init runs once
on first boot. Nothing is typed over SSH to deploy.

This choice is deliberate. A deployment performed by hand exists only in the memory of the
person who did it; a deployment performed by a script *is* its own documentation, can be
repeated exactly, and can be read by a marker. If the instance is lost, launching a new one
with the same script reproduces it.

The script:

1. installs git, nginx and Node 20
2. installs MongoDB 7, rewrites `bindIp` to `127.0.0.1`, and enables the service
3. clones this repository (public, so no credential is needed)
4. installs API dependencies and builds the React app
5. writes `.env` with a freshly generated secret
6. starts the API under pm2 and enables pm2 at boot, so N4 still holds after a restart
7. writes the nginx config and starts it

Progress can be read on the instance at `/var/log/user-data.log`.

---

## 7.5 Reproducing this deployment from scratch

Prerequisites: AWS CLI v2 installed, and access to the IFN636 student role.

### Step 1 — authenticate

```bash
aws configure sso
```

Or write `~/.aws/config` directly:

```
[sso-session qut]
sso_start_url = https://d-97671c4bd0.awsapps.com/start
sso_region = ap-southeast-2
sso_registration_scopes = sso:account:access

[profile ifn636]
sso_session = qut
sso_account_id = 438807478932
sso_role_name = IFN636-STUDENT
region = ap-southeast-2
output = json
```

Then:

```bash
aws sso login --profile ifn636
```

Verify with `aws sts get-caller-identity --profile ifn636`.

### Step 2 — create a key pair

```bash
aws ec2 create-key-pair --key-name n12202665-eventtix-key --query KeyMaterial --output text > n12202665-eventtix-key.pem
```

Keep the `.pem` outside the repository. `*.pem` is git-ignored as a second line of defence.

### Step 3 — find the current Amazon Linux 2023 AMI

```bash
aws ec2 describe-images --owners amazon --filters "Name=name,Values=al2023-ami-2023.*-kernel-6.1-x86_64" "Name=state,Values=available" --query "sort_by(Images,&CreationDate)[-1].ImageId" --output text
```

The SSM public parameter for this AMI is **not** readable by the student role, so it has to
be looked up with `describe-images`.

### Step 4 — launch

```bash
aws ec2 run-instances --image-id <ami> --instance-type t3.micro --key-name n12202665-eventtix-key --subnet-id subnet-01b6baa7effb222fc --security-group-ids sg-0cc12e170c4f78181 --associate-public-ip-address --user-data file://deploy/user-data.sh --block-device-mappings "[{\"DeviceName\":\"/dev/xvda\",\"Ebs\":{\"VolumeSize\":16,\"VolumeType\":\"gp3\",\"DeleteOnTermination\":true}}]" --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=n12202665-nikhittha-eventtix},{Key=Unit,Value=IFN636},{Key=Student,Value=n12202665}]"
```

### Step 5 — allow your own IP through

```bash
MYIP=$(curl -s https://checkip.amazonaws.com)
aws ec2 authorize-security-group-ingress --group-id sg-0cc12e170c4f78181 --ip-permissions "IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges=[{CidrIp=$MYIP/32,Description='n12202665 EventTix web'}]"
```

Do the same for port 22 if SSH is needed. **Do not use `0.0.0.0/0` on this shared group.**

### Step 6 — wait and verify

The bootstrap takes roughly five minutes. `502` from nginx means nginx is up but Node is not
running yet, which is normal while npm is still installing.

```bash
curl http://<public-ip>/api/health
```

Expected: `{"status":"ok","time":"..."}`.

---

## 7.6a The instance is stopped automatically

The instance was found stopped on 24 August without anyone stopping it deliberately. When
this account was first surveyed all 169 instances in it were stopped and none were running,
so the teaching account almost certainly stops instances on a schedule to control cost.

**This matters for the demonstration.** Check the instance is running before the session and
start it if it is not:

```bash
aws ec2 start-instances --instance-ids i-04a1250e9732b2449 --profile ifn636
aws ec2 wait instance-running --instance-ids i-04a1250e9732b2449 --profile ifn636
```

Two things were verified when this happened for real:

- The Elastic IP held, so the address stayed `32.236.117.199` across a full stop and start.
  Without it the address would have changed and every recorded link would have broken.
- The application came back by itself on the first request after boot, with no manual step,
  because pm2 was registered as a boot service. The events and bookings created before the
  stop were all still present, which tests requirement N4 more convincingly than restarting
  the process alone.

---

## 7.6 Routine operations

### Get the current public IP

```bash
aws ec2 describe-instances --instance-ids i-04a1250e9732b2449 --query "Reservations[0].Instances[0].PublicIpAddress" --output text --profile ifn636
```

> **An Elastic IP is attached, so the address is stable.** `32.236.117.199`
> (`eipalloc-0538548177cecdd19`) survives a stop and start, which closes risk RSK-07.
> This was added after the address changed once during development and broke every link
> that had been recorded. Do not release the allocation while the project is being marked.

### SSH in

```bash
ssh -i n12202665-eventtix-key.pem ec2-user@<public-ip>
```

### Deploy a change (this is the demonstration workflow)

```bash
cd ~/event-ticket-booking
git pull
npm --prefix backend ci --omit=dev
npm --prefix frontend ci && npm --prefix frontend run build
pm2 restart eventtix
```

Only the last two lines are needed for a frontend-only change; only `pm2 restart` for a
backend-only one.

### Check what is running

```bash
pm2 status
pm2 logs eventtix --lines 50
sudo systemctl status nginx mongod
sudo tail -100 /var/log/user-data.log
```

### Read the boot log without SSH

```bash
aws ec2 get-console-output --instance-id i-04a1250e9732b2449 --output text --profile ifn636
```

Useful when the bootstrap failed and SSH is not available yet.

---

## 7.7 Open item: access for marking

**Right now the deployed URL is reachable only from the developer machine.** The marker will
not be able to open it from their own network, which the brief requires.

This is not an oversight — it is the consequence of §7.2. Resolving it needs a decision that
is not mine to make, because every option affects other students sharing the security group.

Options, best first:

1. **Ask the tutor for the marking IP** and add that single `/32`. Cleanest: the marker gets
   in, nobody else is exposed. Several `131.181.19.x` addresses already present on these
   groups look like QUT campus addresses, which suggests this is the intended pattern.
2. **Open `0.0.0.0/0` on port 80 immediately before the demonstration and remove it after.**
   Acceptable only with the tutor's agreement, since it exposes ~30 other instances for that
   window.
3. **Ask whether a per-student security group can be provisioned.** Students cannot create
   one, but the account administrator can.

**Action required before submission:** ask the tutor which of these they want, then apply it
and re-verify the URL from outside the developer network.

---

## 7.8 Known limitations

Stated honestly, because US-16 AC3 asks for real gaps rather than a claim that there are none.

- **The Elastic IP is a shared account resource.** One allocation is held for this project.
  No other Elastic IP was in use in the account at the time, so this consumes spare capacity
  rather than taking it from another student, but it should be released once marking is done.
- **Single instance, no load balancer.** Assumption A6. The instance is a single point of
  failure and there is no zero-downtime deployment.
- **HTTP only, no TLS.** A certificate needs a domain name, and there is no domain for this
  project. Tokens and passwords therefore cross the network in the clear. In anything real
  this would be the first thing to fix.
- **MongoDB has no authentication enabled.** It is bound to localhost so it is unreachable
  from outside, but any process on the instance could connect. Acceptable for a single
  purpose instance, not for a shared one.
- **Deployment is manual.** CI/CD is out of scope per the brief.
- **The database is not backed up.** Terminating the instance loses all data, since the
  volume is set to delete on termination.
