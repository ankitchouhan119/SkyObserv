# Terraform Command Reference

A complete guide to important Terraform CLI commands, with explanations and examples.  
This document is a general reference. A short **SkyObserv project** section is included at the end.

Run commands from your Terraform working directory (for this repo: `infra/terraform/`).

---

## Table of contents

1. [Core workflow](#1-core-workflow)
2. [Init](#2-init)
3. [Validate and format](#3-validate-and-format)
4. [Plan](#4-plan)
5. [Apply](#5-apply)
6. [Destroy](#6-destroy)
7. [Refresh](#7-refresh)
8. [Workspaces](#8-workspaces)
9. [Variables](#9-variables)
10. [Outputs](#10-outputs)
11. [State commands](#11-state-commands)
12. [Import and remove from state](#12-import-and-remove-from-state)
13. [Replace and targeted changes](#13-replace-and-targeted-changes)
14. [Modules](#14-modules)
15. [Providers](#15-providers)
16. [Graph and debugging](#16-graph-and-debugging)
17. [Locking](#17-locking)
18. [Console and inspection](#18-console-and-inspection)
19. [Testing](#19-testing)
20. [Terraform Cloud / login](#20-terraform-cloud--login)
21. [Useful flags (all commands)](#21-useful-flags-all-commands)
22. [Common workflows](#22-common-workflows)
23. [Best practices](#23-best-practices)
24. [SkyObserv project notes](#24-skyobserv-project-notes)

---

## 1. Core workflow

The standard order for managing infrastructure:

```bash
terraform init          # prepare backend and download providers
terraform validate      # check syntax
terraform plan          # preview changes
terraform apply         # make changes
terraform destroy       # tear everything down (when needed)
```

| Command | What it does |
|---------|--------------|
| `terraform init` | Initializes a working directory. Downloads providers, sets up the backend, and prepares modules. |
| `terraform validate` | Checks whether configuration files are syntactically valid and internally consistent. Does not contact the cloud provider. |
| `terraform plan` | Creates an execution plan. Shows what Terraform will create, update, or destroy. Does not change real infrastructure. |
| `terraform apply` | Applies the changes required to reach the desired state. Creates, updates, or deletes real resources. |
| `terraform destroy` | Destroys all resources managed by the current configuration and state. |

---

## 2. Init

`terraform init` must be run before other commands in a new directory or after backend/provider changes.

### Basic

```bash
terraform init
```

Downloads providers and prepares the directory. Uses backend settings from your `.tf` files if fully configured.

### With partial backend config (this project)

```bash
terraform init -backend-config=backend-config.hcl
```

Loads backend settings (S3 bucket, key, region, locking) from a separate file. Used when the backend block in `versions.tf` is empty (`backend "s3" {}`).

### Reconfigure backend

```bash
terraform init -reconfigure -backend-config=backend-config.hcl
```

Forces Terraform to reconfigure the backend. Use when backend settings changed or Terraform reports a backend mismatch. Does not migrate state by default.

### Migrate state to remote backend

```bash
terraform init -migrate-state -backend-config=backend-config.hcl
```

Moves an existing local `terraform.tfstate` file to the remote backend (for example S3). Terraform will ask for confirmation.

### Upgrade providers

```bash
terraform init -upgrade
```

Re-downloads providers and updates them within the version constraints in your configuration.

### Upgrade modules

```bash
terraform init -upgrade
```

Also updates modules to the newest versions allowed by your module source constraints.

### Backend config as CLI flags

```bash
terraform init \
  -backend-config="bucket=my-tf-state" \
  -backend-config="key=prod/infra.tfstate" \
  -backend-config="region=ap-south-1"
```

Alternative to a `.hcl` backend config file.

---

## 3. Validate and format

### Validate

```bash
terraform validate
```

Checks configuration validity. Run after editing `.tf` files and before `plan`.

```bash
terraform validate -json
```

Returns validation results in JSON format (useful for CI).

### Format

```bash
terraform fmt
```

Rewrites `.tf` files in the current directory to canonical formatting.

```bash
terraform fmt -recursive
```

Formats all `.tf` files in subdirectories too.

```bash
terraform fmt -check
```

Exits with a non-zero status if files need formatting. Does not modify files. Common in CI pipelines.

```bash
terraform fmt -diff
```

Shows the formatting diff while applying changes.

---

## 4. Plan

### Basic plan

```bash
terraform plan
```

Shows proposed changes compared to current state.

### Plan with variable file

```bash
terraform plan -var-file=terraform.tfvars.stg
```

Loads variable values from a file. You can pass multiple `-var-file` flags.

### Plan with inline variable

```bash
terraform plan -var="instance_type=t3.small"
```

Sets a single variable on the command line. Overrides values from `.tfvars` files.

### Save plan to file

```bash
terraform plan -out=tfplan
```

Saves the plan to a binary file. Apply exactly this plan later with `terraform apply tfplan`. Recommended for production to avoid drift between plan and apply.

### Plan only specific resources

```bash
terraform plan -target=aws_instance.app
```

Limits the plan to one resource and its dependencies. Useful for fixing a single resource without touching everything.

```bash
terraform plan -target=aws_instance.app -target=aws_security_group.app
```

Multiple `-target` flags are allowed.

### Plan a destroy

```bash
terraform plan -destroy
```

Shows what would be destroyed without running `destroy` yet.

### Refresh-only plan

```bash
terraform plan -refresh-only
```

Updates state from the real world and shows changes to state only. Does not propose infrastructure changes. Useful when resources were changed outside Terraform.

### Replace a resource in plan

```bash
terraform plan -replace=aws_instance.app
```

Forces replacement of a specific resource (destroy + create). Available in Terraform 0.15.2+.

### Disable locking (not recommended)

```bash
terraform plan -lock=false
```

Skips state locking. Only use when you fully understand the risk.

---

## 5. Apply

### Basic apply

```bash
terraform apply
```

Shows a plan and asks for confirmation (`yes`) before making changes.

### Apply with variable file

```bash
terraform apply -var-file=terraform.tfvars.prod
```

### Auto-approve (skip confirmation)

```bash
terraform apply -auto-approve
```

Applies without prompting. Common in CI/CD. Use carefully in production.

### Apply a saved plan

```bash
terraform apply tfplan
```

Applies exactly what was saved with `terraform plan -out=tfplan`. Will not prompt for a new plan.

### Apply with targets

```bash
terraform apply -target=aws_instance.app
```

Applies changes only to the targeted resource and its dependencies.

### Control parallelism

```bash
terraform apply -parallelism=5
```

Limits how many resources Terraform modifies at the same time. Default is 10. Lower values can help with API rate limits.

### Replace on apply

```bash
terraform apply -replace=aws_instance.app
```

Forces recreation of a specific resource during apply.

---

## 6. Destroy

### Basic destroy

```bash
terraform destroy
```

Destroys all resources in the current state. Asks for confirmation.

### Destroy with variable file

```bash
terraform destroy -var-file=terraform.tfvars.stg
```

### Auto-approve destroy

```bash
terraform destroy -auto-approve
```

### Destroy specific resources only

```bash
terraform destroy -target=aws_instance.app
```

Destroys only the targeted resource. Other resources remain.

---

## 7. Refresh

### Refresh state

```bash
terraform refresh
```

Updates the state file with the real-world status of resources. Does not change infrastructure. Largely replaced by `terraform apply -refresh-only` in modern workflows.

```bash
terraform apply -refresh-only
```

Preferred modern approach: sync state from the cloud and review state-only changes.

---

## 8. Workspaces

Workspaces let you manage multiple environments (staging, prod) with the same code but separate state files.

| Command | What it does |
|---------|--------------|
| `terraform workspace list` | Lists all workspaces. Current workspace is marked with `*`. |
| `terraform workspace show` | Prints the name of the current workspace. |
| `terraform workspace select <name>` | Switches to an existing workspace. |
| `terraform workspace new <name>` | Creates a new workspace and switches to it. Starts with empty state. |
| `terraform workspace delete <name>` | Deletes a workspace. Cannot delete the workspace you are currently using. |

### Examples

```bash
terraform workspace list
terraform workspace show
terraform workspace new staging
terraform workspace new prod
terraform workspace select staging
terraform workspace select prod
terraform workspace delete dev
```

**Notes:**
- Workspaces are stored in the backend (S3), not in git.
- After cloning a repo, run `terraform init` once, then `terraform workspace list` to see existing workspaces.
- Avoid using the `default` workspace when you have named environments like `staging` and `prod`.

---

## 9. Variables

Variables can be set in `.tf` files, `terraform.tfvars`, environment variables, or on the CLI.

### Variable file

```bash
terraform plan -var-file=terraform.tfvars
terraform plan -var-file=secrets.tfvars -var-file=terraform.tfvars.stg
```

### Inline variable

```bash
terraform apply -var="db_password=MySecret123"
```

### Environment variables

```bash
export TF_VAR_db_password="MySecret123"
terraform plan
```

Any variable `db_password` in `variables.tf` can be set as `TF_VAR_db_password`.

### Variable precedence (highest wins)

1. `-var` on the command line
2. `-var-file`
3. `terraform.tfvars` / `*.auto.tfvars`
4. Environment variables (`TF_VAR_*`)
5. Default value in `variables.tf`

---

## 10. Outputs

Outputs expose values after apply (IPs, URLs, IDs).

```bash
terraform output
```

Prints all outputs.

```bash
terraform output app_public_ip
```

Prints one output by name.

```bash
terraform output -json
```

Prints all outputs as JSON.

```bash
terraform output -raw app_public_ip
```

Prints a single value without quotes. Useful in shell scripts.

```bash
terraform output -state=backup.tfstate
```

Reads outputs from a specific state file instead of the default backend.

---

## 11. State commands

State tracks which real resources belong to your configuration.

| Command | What it does |
|---------|--------------|
| `terraform show` | Shows the current state in human-readable form. |
| `terraform state list` | Lists all resources in state. |
| `terraform state show <address>` | Shows details for one resource. |
| `terraform state mv <source> <destination>` | Renames or moves a resource in state. Does not change real infrastructure. |
| `terraform state rm <address>` | Removes a resource from state. Does not destroy the real resource. |
| `terraform state pull` | Downloads state as JSON to stdout. |
| `terraform state push` | Uploads state from stdin. Dangerous — use only when you know what you are doing. |
| `terraform state replace-provider <old> <new>` | Updates provider references in state after a provider rename or migration. |

### Examples

```bash
terraform show
terraform state list
terraform state show aws_instance.app
terraform state mv aws_instance.old aws_instance.new
terraform state rm aws_instance.orphan
terraform state pull > state-backup.json
```

### When to use `state rm`

Use when you want Terraform to stop managing a resource without deleting it in AWS (for example, a resource you want to keep but remove from this project).

### When to use `state mv`

Use after renaming a resource in `.tf` files so Terraform does not destroy and recreate it.

---

## 12. Import and remove from state

### Import existing infrastructure

```bash
terraform import aws_instance.app i-0abc123def456
```

Brings an existing cloud resource into Terraform state. You must already have a matching `resource` block in your `.tf` files.

```bash
terraform import -var-file=terraform.tfvars.stg aws_db_instance.main my-db-id
```

### Import with config generation (Terraform 1.5+)

```bash
terraform plan -generate-config-out=generated.tf
```

Can help generate configuration while importing (workflow depends on provider and resource type).

---

## 13. Replace and targeted changes

### Force replace (modern approach)

```bash
terraform apply -replace=aws_instance.app
```

Destroys and recreates one resource. Replaces the older `taint` workflow.

### Target specific resources

```bash
terraform apply -target=aws_security_group.app -target=aws_instance.app
```

Limits apply to specific resources. Use sparingly — can leave infrastructure in a partially updated state.

### Legacy: taint (deprecated)

```bash
terraform taint aws_instance.app    # deprecated
terraform untaint aws_instance.app  # deprecated
```

Prefer `-replace` instead.

---

## 14. Modules

```bash
terraform init
```

Automatically downloads modules declared in your configuration.

```bash
terraform get
```

Downloads and updates modules. Usually `init` is enough.

```bash
terraform get -update
```

Updates modules to the latest versions allowed by version constraints.

---

## 15. Providers

```bash
terraform providers
```

Lists providers required by the configuration and their versions.

```bash
terraform version
```

Shows Terraform CLI version and installed provider versions.

```bash
terraform providers mirror /path/to/mirror
```

Downloads provider binaries to a local directory (useful for air-gapped environments).

---

## 16. Graph and debugging

```bash
terraform graph
```

Prints a dependency graph in DOT format. Pipe to Graphviz to visualize:

```bash
terraform graph | dot -Tpng > graph.png
```

```bash
terraform plan -json
```

Outputs the plan as JSON (machine-readable, useful for policy tools and CI).

---

## 17. Locking

Remote backends use locks to prevent two people from running `apply` at the same time.

### Error: `Error acquiring the state lock`

This means either:
- Another `plan` or `apply` is currently running, or
- A previous run was interrupted (Ctrl+C) and left a stale lock.

### Fix stale lock

```bash
terraform force-unlock <LOCK_ID>
```

Example:

```bash
terraform force-unlock c5a4726c-67f2-fb99-cee5-45d6fd651101
```

The lock ID appears in the error message.

**Rules:**
1. Check that no other Terraform or CI job is running.
2. Only force-unlock if the lock is truly stale.
3. Do not use `-lock=false` for routine operations.

---

## 18. Console and inspection

```bash
terraform console
```

Opens an interactive console for evaluating expressions against your configuration and state.

```bash
terraform console
> var.aws_region
> aws_instance.app.public_ip
```

---

## 19. Testing

Terraform supports native tests (`.tftest.hcl` files).

```bash
terraform test
```

Runs tests defined in the configuration.

```bash
terraform test -verbose
```

Shows detailed test output.

---

## 20. Terraform Cloud / login

If you use Terraform Cloud or Terraform Enterprise:

```bash
terraform login
```

Authenticates the CLI with Terraform Cloud and stores credentials.

```bash
terraform logout
```

Removes stored credentials.

---

## 21. Useful flags (all commands)

| Flag | What it does |
|------|--------------|
| `-chdir=<path>` | Run Terraform in another directory without `cd`. Example: `terraform -chdir=infra/terraform plan` |
| `-input=false` | Disables interactive prompts. Useful in CI. |
| `-no-color` | Disables colored output. |
| `-lock=false` | Disables state locking. Avoid in normal use. |
| `-lock-timeout=5m` | How long to wait for a lock before failing. |

Example:

```bash
terraform -chdir=infra/terraform plan -var-file=terraform.tfvars.stg -input=false
```

---

## 22. Common workflows

### First time on a new machine

```bash
cd infra/terraform
terraform init -backend-config=backend-config.hcl
terraform workspace list
terraform workspace select staging
terraform validate
terraform plan -var-file=terraform.tfvars.stg
terraform apply -var-file=terraform.tfvars.stg
```

### Switch environment (no re-init)

```bash
terraform workspace select prod
terraform plan -var-file=terraform.tfvars.prod
terraform apply -var-file=terraform.tfvars.prod
```

### Safe production apply

```bash
terraform workspace select prod
terraform plan -var-file=terraform.tfvars.prod -out=prod.tfplan
# review the plan carefully
terraform apply prod.tfplan
```

### Tear down one environment

```bash
terraform workspace select staging
terraform destroy -var-file=terraform.tfvars.stg
```

### Rename a resource without recreating it

```bash
# 1. Rename in .tf file
# 2. Move in state
terraform state mv aws_instance.old_name aws_instance.new_name
terraform plan   # should show no changes
```

### Stop managing a resource (keep it in AWS)

```bash
terraform state rm aws_instance.legacy
```

### Import an existing EC2 instance

```bash
# 1. Add resource block to .tf
# 2. Import
terraform import aws_instance.app i-0123456789abcdef0
terraform plan   # fix any drift in config
```

---

## 23. Best practices

| Do | Don't |
|----|-------|
| Run `plan` before every `apply` | Run `apply` blindly on production |
| Use remote state (S3) with locking | Store state only on your laptop |
| Use workspaces or separate state per environment | Mix staging and prod in one state |
| Commit `.tf` files and `.terraform.lock.hcl` | Commit `terraform.tfvars` with secrets |
| Use `terraform fmt` before commits | Force-unlock while CI is running |
| Use `-out` for production applies | Use `-lock=false` in normal workflows |
| Check `terraform workspace show` before destroy | Destroy without confirming the workspace |

---

## 24. SkyObserv project notes

Project-specific paths and files for this repository.

### Key files

| File | Purpose |
|------|---------|
| `backend-config.hcl` | S3 backend settings and workspace prefix |
| `terraform.tfvars.stg` | Staging variable values (gitignored) |
| `terraform.tfvars.prod` | Production variable values (gitignored) |
| `*.example` | Templates to copy locally |

### S3 state paths

| Workspace | State file |
|-----------|------------|
| `staging` | `s3://8byte-tf-state-ankit/skyobserv/staging/infra.tfstate` |
| `prod` | `s3://8byte-tf-state-ankit/skyobserv/prod/infra.tfstate` |

### One-time S3 bucket setup

```bash
./backend-setup.sh
```

Creates the `8byte-tf-state-ankit` bucket with versioning enabled.

### Copy local var files

```bash
cp terraform.tfvars.stg.example terraform.tfvars.stg
cp terraform.tfvars.prod.example terraform.tfvars.prod
```

### Project outputs

```bash
terraform output app_public_ip
terraform output rds_endpoint
```

### Verify state in S3

```bash
aws s3 ls s3://8byte-tf-state-ankit/skyobserv/ --recursive
```

---

## Quick cheat sheet

| Goal | Command |
|------|---------|
| Initialize | `terraform init` |
| Init with backend file | `terraform init -backend-config=backend-config.hcl` |
| Validate config | `terraform validate` |
| Format code | `terraform fmt -recursive` |
| Preview changes | `terraform plan` |
| Save plan | `terraform plan -out=tfplan` |
| Apply changes | `terraform apply` |
| Apply saved plan | `terraform apply tfplan` |
| Destroy all | `terraform destroy` |
| List workspaces | `terraform workspace list` |
| Current workspace | `terraform workspace show` |
| Switch workspace | `terraform workspace select <name>` |
| Show state | `terraform show` |
| List resources in state | `terraform state list` |
| Import resource | `terraform import <address> <id>` |
| Remove from state | `terraform state rm <address>` |
| Force replace | `terraform apply -replace=<address>` |
| Target one resource | `terraform apply -target=<address>` |
| Unlock stale state | `terraform force-unlock <LOCK_ID>` |
| Show outputs | `terraform output` |
| Terraform version | `terraform version` |
| Run tests | `terraform test` |
