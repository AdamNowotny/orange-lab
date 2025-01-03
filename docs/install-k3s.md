# Installation - Kubernetes nodes (K3S)

## Firewall

Setup firewall rules on k3s server and worker nodes:

```sh
firewall-cmd --permanent --add-source=10.42.0.0/16 # Pods
firewall-cmd --permanent --add-source=10.43.0.0/16 # Services
firewall-cmd --permanent --add-port=6443/tcp # API Server
firewall-cmd --permanent --add-port=10250/tcp # Kubelet metrics
firewall-cmd --permanent --add-port=9100/tcp # Prometheus metrics
firewall-cmd --permanent --add-port=5001/tcp # Spegel (Embedded distributed registry)
firewall-cmd --permanent --add-port=6443/tcp # Spegel (Embedded distributed registry)
systemctl reload firewalld
```

In case of connectivity issues, try disabling the firewall:

```sh
systemctl disable firewalld.service --now
```

## (Optional) Disable suspend on laptops

Turn off suspend mode when on AC power. The setting in Gnome UI only applies when you're logged in, but not on login screen. You can check current settings with:

```sh
# Check current settings
sudo -u gdm dbus-run-session gsettings list-recursively org.gnome.settings-daemon.plugins.power | grep sleep

# Disable suspend mode on AC power:
sudo -u gdm dbus-run-session gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-timeout 0
```

# Installation - K3S server

Server has to be installed before any other nodes can be added.

It is recommended that the Kubernetes server is installed on a machine that's online 24/7 but it's not required - running everything on a single laptop is fine too, however the availability of services will be limited.

Installing server will also run an agent node on the same machine.

## K3S server

Run the script on _management node_:

```sh
./scripts/k3s-server.sh
```

then copy the contents and run it on the _server node_ to install k3s server and agent.

Make sure the service is running and enabled on startup:

```sh
systemctl enable k3s.service --now
```

## Save server configuration

Add the tailscale IP of the server to Pulumi configuration:

```sh
pulumi config set k3s:serverIp <server_ip>
pulumi config set k3s:serverIp $(tailscale ip -4) # localhost
```

Add generated agent token to Pulumi configuration as secret:

```sh
ssh <user>@<k8s-server>
sudo cat /var/lib/rancher/k3s/server/node-token

K3S_TOKEN=<token> # copy from server node
pulumi config set k3s:agentToken $K3S_TOKEN --secret
```

## Kube config for admin

```
rm -f ~/.kube/config
scp <user>@<k8s-server>:.kube/config ~/.kube/config
```

# Installation - K3S agents

Install K3S agent nodes on any additional physical hardware. Server already runs an agent.

It is recommended but not required that they will be online all the time.

## K3S agent

Run the script on _management node_:

```sh
./scripts/k3s-agent.sh
```

then copy the contents and run it on the _agent node_ to install k3s agent.

Make sure the service is running and enabled on startup:

```sh
systemctl enable k3s-agent.service --now
```

## Node labels

You can set node labels later when installing applications. Examples:

```sh
# Storage node used by Longhorn, at least one is needed
kubectl label nodes <node-name> orangelab/storage=true

# GPU node for Ollama
kubectl label nodes <node-name> orangelab/gpu=true

# Set zone, used f.e. by home-assistant to deploy to node on same network as sensors
kubectl label nodes <node-name> topology.kubernetes.io/zone=home
```
