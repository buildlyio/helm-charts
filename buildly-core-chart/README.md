# buildly.io

[Buildly](https://buildly.io/) Buildly is Software Architecture as a Service - The Buildly core is a gateway layer for cloud native architectures running containerized services in a Kubernetes cluster.  It has a pluggable architecture for additional modules like USERS - user management, MESH - datamesh and aggregation for rest services, and TEMPLATES - a reuseable set of workflow models for optimizing application building and information architectures.

## TL;DR;

```console
helm install buildly
```

## Installing the Chart

To install the chart with the release name `my-release`:

```console
helm install --name my-release buidly-core
```

> note: The chart will not install the drone server until you have configured a source control option. If this is the case it will print out notes on how to configure it in place using `helm upgrade`.

An example (secrets redacted) working install of the chart using github as the source control provider:

```console
helm install --name buildly --namespace buildly stable/buildly

kubectl create secret generic drone-server-secrets \
      --namespace=cicd-drone \
      --from-literal=clientSecret="XXXXXXXXXXXXXXXXXXXXXXXX"

helm upgrade buildly \
  --reuse-values --set 'service.type=LoadBalancer' \
  --set 'service.loadBalancerIP=2.1.60.3' --set 'sourceControl.provider=github' \
  --set 'sourceControl.github.clientID=XXXXXXXX' \
  --set 'sourceControl.secret=drone-server-secrets' --set 'server.host=buildly.example.com' \
  stable/drone
```

## Uninstalling the Chart

To uninstall/delete the `my-release` deployment:

```console
helm delete --purge my-release
```

The command removes nearly all the Kubernetes components associated with the
chart and deletes the release.

## Configuration

The following table lists the configurable parameters of the drone charts and their default values.

| Parameter                   | Description                                                                                   | Default                     |
|-----------------------------|-----------------------------------------------------------------------------------------------|-----------------------------|
| `images.server.repository`  | Buildly **server** image                                                                        | `docker.io/buildly/buildly`     |
| `images.server.tag`         | Buildly **server** image tag                                                                    | `1.2`                       |
| `images.server.pullPolicy`  | Buildly **server** image pull policy                                                            | `IfNotPresent`              |
| `images.agent.repository`   | Buildly **agent** image                                                                         | `docker.io/buildly/buildly`     |
| `images.agent.tag`          | Buildly **agent** image tag                                                                     | `1.2`                       |
| `images.agent.pullPolicy`   | Buildly **agent** image pull policy                                                             | `IfNotPresent`              |
| `images.dind.repository`    | Docker **dind** image                                                                         | `docker.io/library/docker`  |
| `images.dind.tag`           | Docker **dind** image tag                                                                     | `18.06.1-ce-dind`           |
| `images.dind.pullPolicy`    | Docker **dind** image pull policy                                                             | `IfNotPresent`              |


## Digital Ocean Steps

Download Digital Oceans DOCTL tool from GitHub

```console
doctl auth init
```

Get or set your local access token from Digital Oceans API manager
https://cloud.digitalocean.com/account/api/tokens

Download the kubeconfig file for the cluster and move to your ~/.kube directory
k8s-1-15-3-do-1-nyc1-1567006107778-kubeconfig.yaml

Use it to set your current Context:
```console
kubectl config current-context --kubeconfig ~/.kube/k8s-1-15-3-do-1-nyc1-1567006107778-kubeconfig.yaml
kubectl config use-context do-nyc1-k8s-1-15-3-do-1-nyc1-1567006107778
```

### Helm with DO
```console
11:19:16$ kubectl config use-context do-nyc1-k8s-1-15-3-do-1-nyc1-1567006107778
Switched to context "do-nyc1-k8s-1-15-3-do-1-nyc1-1567006107778".

11:19:59$ helm init
$HELM_HOME has been configured at /Users/glind/.helm.
```

Tiller (the Helm server-side component) has been installed into your Kubernetes Cluster.

Please note: by default, Tiller is deployed with an insecure 'allow unauthenticated users' policy.
For more information on securing your installation see: https://docs.helm.sh/using_helm/#securing-your-helm-installation
Happy Helming!
```console
11:25:38$ kubectl -n kube-system create serviceaccount tiller
serviceaccount "tiller" created

11:25:57$ kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount=kube-system:tiller
clusterrolebinding.rbac.authorization.k8s.io "tiller" created

11:26:10$ helm init --service-account tiller
$HELM_HOME has been configured at /Users/glind/.helm.
Warning: Tiller is already installed in the cluster.
(Use --client-only to suppress this message, or --upgrade to upgrade Tiller to the current version.)
Happy Helming!

11:26:19$ kubectl get pods --namespace kube-system
NAME                              READY     STATUS    RESTARTS   AGE
cilium-9g7zq                      1/1       Running   0          23h
cilium-jxx2v                      1/1       Running   0          23h
cilium-operator-b8c856758-sr6dq   1/1       Running   0          23h
coredns-9d6bf9876-kg8t4           1/1       Running   0          23h
coredns-9d6bf9876-rl4q2           1/1       Running   0          23h
csi-do-node-b9nv5                 2/2       Running   0          23h
csi-do-node-d89hk                 2/2       Running   0          23h
do-node-agent-srwbl               1/1       Running   0          23h
do-node-agent-w9qbh               1/1       Running   0          23h
kube-proxy-m7s47                  1/1       Running   0          23h
kube-proxy-pzgds                  1/1       Running   0          23h
tiller-deploy-549fb567f6-f9xsh    1/1       Running   0          54s
```
