# buildly.io

[Buildly](https://buildly.io/) Buildly is Software Architecture as a Service - The Buildly core is a gateway layer for cloud native architectures running containerized services in a Kubernetes cluster.  It has a pluggable architecture for additional modules like USERS - user management, MESH - datamesh and aggregation for rest services, and TEMPLATES - a reuseable set of workflow models for optimizing application building and information architectures.

## TL;DR;

```console
helm install buildly-core
```

## Installing the Chart

To install the chart with the release name `my-release`:

```console
helm install --name my-release buidly-core
```

> note: The chart will not install the drone server until you have configured a source control option. If this is the case it will print out notes on how to configure it in place using `helm upgrade`.

An example (secrets redacted) working install of the chart using github as the source control provider:

```console
helm install --name buildly-core --namespace buildly-core stable/buildly-core

kubectl create secret generic drone-server-secrets \
      --namespace=cicd-drone \
      --from-literal=clientSecret="XXXXXXXXXXXXXXXXXXXXXXXX"

helm upgrade buildly-core \
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
| `images.server.repository`  | Buildly **server** image                                                                        | `docker.io/buildly/buildly-core`     |
| `images.server.tag`         | Buildly **server** image tag                                                                    | `1.2`                       |
| `images.server.pullPolicy`  | Buildly **server** image pull policy                                                            | `IfNotPresent`              |
| `images.agent.repository`   | Buildly **agent** image                                                                         | `docker.io/buildly/buildly-core`     |
| `images.agent.tag`          | Buildly **agent** image tag                                                                     | `1.2`                       |
| `images.agent.pullPolicy`   | Buildly **agent** image pull policy                                                             | `IfNotPresent`              |
| `images.dind.repository`    | Docker **dind** image                                                                         | `docker.io/library/docker`  |
| `images.dind.tag`           | Docker **dind** image tag                                                                     | `18.06.1-ce-dind`           |
| `images.dind.pullPolicy`    | Docker **dind** image pull policy                                                             | `IfNotPresent`              |
