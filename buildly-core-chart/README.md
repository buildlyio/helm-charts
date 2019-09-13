# buildly.io

[Buildly](https://buildly.io/) Buildly is Software Architecture as a Service - The Buildly core is a gateway layer for cloud native architectures running containerized services in a Kubernetes cluster.  It has a pluggable architecture for additional modules like USERS - user management, MESH - datamesh and aggregation for rest services, and TEMPLATES - a reuseable set of workflow models for optimizing application building and information architectures.

To install Buildly on [Digital Ocean Managed Kubernetes Cluster](https://www.digitalocean.com/products/kubernetes/) follow the steps outlined below using Helm 2.+ |

## Digital Ocean Setup Steps

If you have not connected to your hosted cluster on digital ocean yet forllow the steps here to use and download Digital Oceans DOCTL tool from GitHub

```console
doctl auth init
```

Get or set your local access token from Digital Oceans API manager
https://cloud.digitalocean.com/account/api/tokens

Download the kubeconfig file for the cluster and move to your ~/.kube directory

Example file:
``` console
k8s-1-15-3-do-1-nyc1-1567006107778-kubeconfig.yaml
```

Use the config file to set your current Context:
```console
kubectl config current-context --kubeconfig ~/.kube/k8s-1-15-3-do-1-nyc1-1567006107778-kubeconfig.yaml
kubectl config use-context do-nyc1-k8s-1-15-3-do-1-nyc1-1567006107778
```

### Helm with DO
Switch Context in Kubectl and init Helm in your contect:
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

### Check version of kubectl and create a name space
```console
kubectl create -f namespace-buildly.json
```
If you have a problem check the version the client should not be more then 1 minor version away from the server
```console
kubectl version

brew switch kubernetes-cli v1.15.3
brew upgrade kubernetes-cli
kubectl version
kubectl create -f namespace-buildly.json
```
Also check if you have google-cloud-sdk in your path it may be forcing your client to a GCP preferred version

Set context to namespace
```console
kubectl config set-context buildly --namespace buildly
```

kubectl config set-context dev --namespace=buildly \
>   --cluster=do-nyc1-k8s-1-15-3-do-1-nyc1-1567006107778 \
>   --user=system:serviceaccount:kube-system:default

Update Tiller account
``` console
helm install buildly-core-chart --namespace buildly --name buildly
kubectl create serviceaccount tiller --namespace kube-system
kubectl create -f tiller-clusterrolebinding.yaml
kubectl create -f tiller-clusterrolebinding.yaml
helm init --service-account tiller --upgrade
```
Now Install Buildly
``` console
helm install buildly-core-chart --namespace buildly --name buildly
```

Verify RELEASE
``` console
helm status buildly-core-chart
```

Confirm and configure Cluster in the K8 dashboard
``` console
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0-beta1/aio/deploy/recommended.yaml

kubectl proxy
```

Get Token for auth
``` console
kubectl --kubeconfig=../kubeconfigs/k8s-1-15-3-do-1-nyc1-1567006107778-kubeconfig.yaml get secret -n kube-system
NAME                               TYPE                                  DATA   AGE
cilium-operator-token-p44p5        kubernetes.io/service-account-token   3      2d21h
cilium-token-xlhkv                 kubernetes.io/service-account-token   3      2d21h
coredns-token-mpxpd                kubernetes.io/service-account-token   3      2d21h
csi-do-controller-sa-token-gnp68   kubernetes.io/service-account-token   3      2d21h
csi-do-node-sa-token-m7hrt         kubernetes.io/service-account-token   3      2d21h
default-token-86mdz                kubernetes.io/service-account-token   3      2d21h
do-agent-token-2mkg4               kubernetes.io/service-account-token   3      2d21h
etcd-secrets                       Opaque                                3      2d21h
kube-proxy                         Opaque                                1      2d21h
kube-proxy-token-f2z2p             kubernetes.io/service-account-token   3      2d21h
tiller-token-hgrj9                 kubernetes.io/service-account-token   3      45h
--- @ Gregs-MBP-2 (glind) ~/Projects
09:03:23$ kubectl --kubeconfig=../kubeconfigs/k8s-1-15-3-do-1-nyc1-1567006107778-kubeconfig.yaml describe secret tiller-token-hgrj9 -n kube-system
```
Use Token to login via proxy API_URL
http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/#/overview?namespace=default
