/*
RMIT University Vietnam
Course: COSC2767|COSC2805 Systems Deployment and Operations
Semester: 2025B
Assessment: Assignment 2
Author: Bui Viet Anh
ID: s3988393
Created  date: 14/09/2025
Last modified: 18/09/2025
Acknowledgement: None
*/

# RMIT Store - AWS CI/CD Pipeline Setup Guide

This repository# Store GitHub Personal Access Token (secure input)contains the infrastructure and configuration files for deploying the RMIT Store application using AWS services with a complete CI/CD pipeline.

**Group Member:**
   - Bui Viet Anh - s3988393
   - Le Trung Hau - s3741297
   - Nguyen Tien Dung - s3999561
   - Nguyen Tan Thang - s3986344
   - Nguyen Thanh Nhan - S4073629

**Github Classroom Repo Link:** https://github.com/RMIT-Vietnam-Teaching/cosc2767-assignment-2-2025b-sg-group-4-1

## Overview

The setup includes:

- **EKS Cluster** for Kubernetes orchestration
- **MongoDB** for database services
- **Jenkins** for CI/CD automation
- **CloudWatch** for monitoring and logging
- **Ansible** for infrastructure configuration
- **Docker** for containerization

## Prerequisites

- Basic knowledge of AWS services (EC2, CloudFormation, EKS, ...)
- Gmail account for email notifications (or equivalent SMTP service)

## Project Structure Integration

⚠️ **Important**: This repository contains CI/CD configuration files that should be integrated into your main application repository which is the one that you fork from teacher.

### File Integration Guide (This is just example, you need to do for all of the rest like server/, k8s/, ...):

- Copy the `ansible/` folder to your application's root directory
- For the client application:
  - Copy `docker-entrypoint.sh` and `Dockerfile` to your existing `client/` folder
  - Review `package.json` for additional dependencies and install as needed. For example the "@playwright/test" dependency in root package.json is one of them that need to be installed.
- Review and adapt other configuration files as necessary

IMPORTANT: You should copy all files in this repository except the `package*.json` and `README.md` files to the forked repository

## Setup Instructions

### Step 1: Configure Email Notifications

Before proceeding, update the email configuration in `ansible/roles/jenkins_host/templates/jenkins_override.conf.j2`:

```bash
# Replace with your email address
Environment="JENKINS_ADMIN_EMAIL=Jenkins CI <your-email@gmail.com>" 
Environment="DEFAULT_RECIPIENTS=your-notification-email@gmail.com"

# Replace with your github name
Environment="GITHUB_USER=Im-Viet" # Not "Im-Viet" but your github name
```

### Step 2: Create AWS Key Pair

1. Navigate to **EC2 Console** → **Key Pairs**
2. Click **Create Key Pair**
3. Name it `key`
4. Download the `key.pem` file and store it securely

Note: Please do not use an existing key pair that you may have already created. This is because the pipeline relies on the fact that the key is named `key.pem`. Key pairs have to be created manually in the EC2 dashboard, only those created through that does AWS register that keypair. Therefore, you cannot just rename the existing key that you have locally as this is not registered on AWS

### Step 3: Configure AWS Parameters

**Prerequisites for this step:**

- GitHub Personal Access Token (PAT) - [Create one here](https://github.com/settings/tokens)
- Gmail App Password - [Setup guide](https://support.google.com/accounts/answer/185833)

Open **AWS CloudShell**, create a new .sh file and paste in the following script

```bash
# Set AWS region
export AWS_DEFAULT_REGION=us-east-1
REGION=us-east-1

# safer input (won’t echo on screen)
printf "GitHub PAT: " ; read -s GH_PAT ; echo
aws ssm put-parameter --name /ci/github/pat --type SecureString --value "$GH_PAT" --overwrite
unset GH_PAT

# Store SMTP credentials
read -p "SMTP user (e.g. you@gmail.com): " SMTP_USER
aws ssm put-parameter --name /ci/smtp/user --type String --value "$SMTP_USER" --overwrite
unset SMTP_USER

printf "SMTP app password: " ; read -s SMTP_PASS ; echo
aws ssm put-parameter --name /ci/smtp/pass --type SecureString --value "$SMTP_PASS" --overwrite
unset SMTP_PASS

# Upload key.pem file (upload the file to CloudShell first, if you don't know how to upload then Google it!)
aws ssm put-parameter \
  --name /ci/keys/mongo_pem \
  --type SecureString \
  --value "file://$PWD/key.pem" \
  --overwrite \
  --region "$REGION"

# Verify parameters are stored correctly
aws ssm get-parameter --name /ci/smtp/user --query 'Parameter.Value' --output text
aws ssm get-parameter --with-decryption --name /ci/github/pat --query 'Parameter.Value' --output text
aws ssm get-parameter --with-decryption --name /ci/smtp/pass --query 'Parameter.Value' --output text
aws ssm get-parameter \
  --with-decryption \
  --name /ci/keys/mongo_pem \
  --query Parameter.Value \
  --output text \
  --region "$REGION" | sed -n '1,5p'
```

The PAT is prompted at runtime. So you do not need to edit the bash script above. You should also prepare an app password in Gmail (which wil allow an application to act as a email client), which will be prompted.

Make sure to change the permission of the bash script file and then execute that script.

> **Note**: To upload `key.pem` to CloudShell, use the upload feature in the CloudShell interface or drag and drop the file.

### Step 4: Deploy CloudFormation Stacks

Deploy the infrastructure components in the following order:

1. **EKS Stack** (15-20 minutes)
2. **MongoDB Stack** (1-2 minutes)
3. **Jenkins Stack** (1-2 minutes)
4. **CloudWatch Stack** (1-2 minutes)

#### General Stack Creation Process:

1. Navigate to **CloudFormation Console**
2. Click **Create Stack** → **With new resources**
3. Choose **Upload a template file**
4. Select the appropriate template file from `ansible/templates/cfn/` (This is step 1)
5. ==Select **LabRole** as the IAM role (This is step 3)==

#### Stack-Specific Configuration: (These are step 2)

Note: The specific subnet which you choose for these CloudFormation Stack does not matter and doesn't affect the application as a whole. As long as you avoid subnet 1e

**EKS Stack (`eks-iac.yaml`):**

- Stack Name: `EKS`
- SubnetIds: Select 2 subnets (avoid subnet 1e - it's restricted)

**MongoDB Stack (`mongodb-iac.yaml`):**

- Stack Name: `MongoDB`
- Select 1 SubnetId and VPCId (avoid subnet 1e - it's restricted)
- Key Pair: `key`

**Jenkins Stack (`jenkins-iac.yaml`):**

- Stack Name: `Jenkins`
- Select 1 SubnetId and VPCId (avoid subnet 1e - it's restricted)
- Key Pair: `key`
- Repository URL: Your GitHub repository URL
- NOTE: It's important that you select an IAM role for this stack

> ⚠️ **Important**: After Jenkins stack creation, wait an additional 10 minutes for the Jenkins server to complete its setup process. The CloudWatch stack is optional here, you can do it later!

**CloudWatch Stack (`cloudwatch-iac.yaml`):**

- Stack Name: `CloudWatch`
- LoadBalancerName: you should go to the EC2 console and choose section load balancer and copy the name of it to the field.
- AlarmEmail: choose one to recieve notifications.
- InstanceId1: choose the jenkins instance.
- InstanceId2 & 3: fill in it if you want which is optional.

> **Note**: There should only one and just one load balancer appear in the ec2 console which is the one you need to copy the name.

> ⚠️ **Important**: The loadbalancer name only appears after you run the pipeline job at least one because it is installed during the pipeline, so make sure that you create CloudWatch stack after you have done with the pipeline job.

### Step 5: Configure Jenkins

1. **Access Jenkins**:

   - Navigate to the Jenkins URL from the EC2 using the public IP with port 8080
   - Login credentials:
     - Username: `admin`
     - Password: `admin`
   - Skip plugin installation when prompted
   - Click **Start using Jenkins**

2. **Create Pipeline Job**:

   - Click **New Item**
   - Job Name: `rmit-store`
   - Type: **Multibranch Pipeline**
   - Click **OK**

3. **Configure Source**:

   - In the configuration page, click **Add source** → **GitHub**
   - Select **GitHub PAT** as the credential type
   - Paste your repository URL
   - Click **Apply** and **Save**

4. **Execute Pipeline**:

   - Navigate to your `rmit-store` job
   - Trigger a build to verify the deployment pipeline

5. **Setup GitHub Webhook**: (This is in course material, you would want to refer to the lecture material or Google it)
   - Configure webhook in your GitHub repository settings
   - Point to your Jenkins instance for automatic builds on code changes

### Common Issues:

- **Stack Creation Fails**: Verify IAM permissions and resource limits
- **Jenkins Not Accessible**: Check security groups and wait for full initialization
- **Pipeline Fails**: Verify GitHub credentials and repository access
- **Email Notifications Not Working**: Double-check SMTP credentials and app password

### Verification Steps:

1. Confirm all CloudFormation stacks are in `CREATE_COMPLETE` status
2. Verify Jenkins is accessible and configured properly
3. Test pipeline execution with a sample commit
4. Check application deployment in EKS cluster

## Additional Resources

- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Jenkins Pipeline Documentation](https://www.jenkins.io/doc/book/pipeline/)
- [GitHub Webhook Setup](https://docs.github.com/en/developers/webhooks-and-events/webhooks)

## Support

For technical issues or questions about this setup, please refer to your course materials.

## Diagram

### CI/CD Pipeline Flow – RMIT Store

```bash
                                         Developer (GitHub)
                                                  |
                                                  | (push / PR)
                                                  v
                                        +-------------------+
                                        |   GitHub Webhook  |
                                        +-------------------+
                                                  |
                                                  v
                                        +--------------------+        credentials        +----------------+
                                        | Jenkins Controller |-------------------------->|   AWS / IAM    |
                                        +--------------------+                           +----------------+
                                                  |
                                                  | pipeline
                                                  v
        +-------------------------------------------------------------------------------------------+
        | Jenkins Stages                                                                            |
        |-------------------------------------------------------------------------------------------|
        | 1) Resolve IDs & Login to ECR -> 2) Ansible: Setup -> 3) Ensure ECR repositories          |
        |                                                                                           |
        | 4) Backend: Unit + Integration tests                                                      |
        |                                                                                           |
        | 5) Build & Push Images --(docker push)--> Amazon ECR                                      |
        |                                                                                           |
        | 6) Configure kubectl (EKS context)                                                        |
        |                                                                                           |
        | 7) Config (Ansible DEV) -> 8) Apply k8s manifests (DEV, first time only) -> 9) Deploy DEV |
        |                                                                                           |
        | 10) Discover Ingress & URLs -> 11) Apply Dev Ingress (base) -> 12) Seed database          |
        |                                                                                           |
        | 13) Dev UI E2E (Playwright)                                                               |
        |                                                                                           |
        | 14) Config (Ansible PROD) -> 15) Deploy to PROD (Blue/Green) -> 16) Apply Canary Ingress  |
        | → Gradual Traffic Shift (e.g., 10% → 50% → 100%)                                          |
        | → Promote new version OR Roll back (rollout undo)                                         |
        +-------------------------------------------------------------------------------------------+
            |                                                                                   |
            | post actions                                                                      | post actions
            v                                                                                   v
 +--------------------+                                                              +---------------------+
 | Notifications      |<--------- emailext: success/failure, links, logs ------------| Artifact Archiving  |
 | (Email recipients) |                                                              | (Dockerfiles, k8s)  |
 +--------------------+                                                              +---------------------+
```

### Flow of Artifacts & Traffic

```bash
Source code (GitHub) ──► Jenkins
   └─> Docker images built ──► ECR repositories
         └─> K8s Deployments (DEV) pull images from ECR
               └─> Ingress (DEV) exposes app ► E2E tests ► OK? ► proceed
                     └─> (PROD) Blue/Green Deployments pull from ECR
                           └─> Canary Ingress splits traffic (old vs new)
                                 └─> Promote to 100% or Roll back

Notifications: Jenkins emailext on failure/success with build links.
Artifacts: Jenkins archives key files (Dockerfiles, k8s YAMLs) for traceability.
```

- **Stage Breakdown (compact)**:
  - SCM & Prep: Resolve AWS IDs/regions, ECR login; Ansible bootstrap; ensure ECR repos.
  - Quality Gate: Backend unit + integration tests.
  - Build & Publish: Build Docker images; push to Amazon ECR.
  - Cluster Context: Configure kubectl to target EKS.
  - DEV Deploy: Apply base manifests (first time), deploy to DEV, discover ingress, seed database, run Playwright E2E.
  - PROD Deploy: Apply PROD config; perform Blue/Green rollout; attach Canary Ingress for gradual traffic shifting; promote or rollback.
  - **Post**: Email notifications (emailext) and artifact archiving.

### Runtime Architecture - RMIT Store

- **On EKS**

```bash
                                     +------------------------------+
      Internet / Users  ── DNS ──►   |  [ Public IP / Classic LB ]  |
                                     |   (svc/ingress-nginx LB)     |
                                     +------------------------------+
                                                     |
                                       +-------------v--------------+
                                       |  NGINX Ingress Controller  |  (ingress-nginx)
                                       +----------+-----------------+
                                                     |
                                   +-----------------+-------------------+
                                   |                                     |
                             (namespace: dev)                   (namespace: prod)
                      +-----------------------------+     +-----------------------------+
                      |   Ingress (dev base rules)  |     |   Ingress (prod + canary)   |
                      +--------------+--------------+     +--------------+--------------+
                                     |                                   |
                                     v                                   v
                              +--------------+                   +--------------+
                              | frontend-svc |                   | frontend-svc |
                              +------+-------+                   +------+-------+
                                     |                                  |        \ (traffic split by selector)
                                     v                                  v         v
                       +-------------------------+         +------------------+  +------------------+
                       |  Deployment: frontend   |         |  Deploy: front-  |  | Deploy: front-   |
                       |  (dev pods)             |         |  end-blue (pods) |  | end-green (pods) |
                       +-------------+-----------+         +---------+--------+  +---------+--------+
                                     |                           90% |          / 10%
                                     v                               v         v
                              +--------------+                +----------------+
                              |  backend-svc |                |  backend-svc   |
                              +------+-------+                +------+---------+
                                     |                               |          \ (traffic split by selector)
                                     v                               v           v
                       +----------------------+            +------------------+  +------------------+
                       |  Deployment: backend |            |  Deploy: back-   |  |  Deploy: back-   |
                       |  (dev pods)          |            |  end-blue (pods) |  |  end-green (pods)|
                       +------------+---------+            +---------+--------+  +---------+--------+
                                    |                                |                      |
                                    ─────────────────────────────────────────────────────────
                                                            |
                                                            v
                                                   +--------------------+
                                                   | MongoDB (stateful) |
                                                   |     share PV       |
                                                   +--------------------+
```

- **Outside the EKS (image supply & nodes)**

```bash
+-------------------------+             +---------------------------+
| Amazon ECR              |  images ->  |   K8s Deployments (all)   |
| (frontend / backend)    |             |   pull images via nodes   |
+-------------------------+             +---------------------------+
                                                      |
                                                      v
                                             +------------------+
                                             |  EKS Node Group  |
                                             |  (EC2 worker(s)) |
                                             +------------------+
```

### Blue‑Green + Canary Strategy

```bash
Traffic Progression                             Internet / Users
Step 1: 90% blue / 10% green                            |
Step 2: 50% blue / 50% green                            v
Step 3: 0%  blue / 100% green (promote)   [ Classic LB ] (from svc/ingress-nginx)
                                                        |
                                                        v
                                            +-----------------------+
                                            |   NGINX Ingress Ctrl  | (ingress-nginx)
                                            +-----------+-----------+
                                                        |
                                                        v
                                        +------------------------------+
                                        |      app-ingress-canary      |
                                        | - routes '/' to frontend-svc | (namespace: prod)
                                        | - canary rules on host/path  |
                                        +---------------+--------------+
                                                        |
                                                        v
                                            +-----------------------+
                                            |     frontend-svc      | (ClusterIP)
                                            +----------+------------+
                                                   90% | 10% ◄── initial canary step
                                                      / \
                                                     v   v
                                          +-----------+ +-----------+
                                          | frontend- | | frontend- |
                                          | blue (RS) | | green (RS)| (Deployments)
                                          +-----+-----+ +-----+-----+
                                                |             |
                                                v             v
                                             +------------------+
                                             |    backend-svc   |   (ClusterIP)
                                             +---------+--------+
                                                   90% | 10% ◄── mirrors frontend split
                                                      / \
                                                     v   v
                                          +-----------+ +-----------+
                                          | backend-  | | backend-  |
                                          | blue (RS) | | green (RS)| (Deployments)
                                          +-----+-----+ +-----+-----+
                                                |             |
                                                +-----v v----+
                                                    +------+
                                                    |  DB  |
                                                    +------+
```
