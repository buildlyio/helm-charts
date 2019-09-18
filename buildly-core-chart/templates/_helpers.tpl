{{/* vim: set filetype=mustache: */}}

{{- define "buildly.secrets" }}
  {{- $secretName := .Values.secret.name -}}
  {{- range $key, $val := .Values.secret.data }}
  - name: {{ $key }}
    valueFrom:
      secretKeyRef:
        key: {{ $key }}
        name: {{ $secretName }}
  {{- end }}
{{- end }}


{{- define "buildly.gcp" }}
  - name: cloudsql-proxy
    image: "gcr.io/cloudsql-docker/gce-proxy:1.14"
    command: ["/cloud_sql_proxy",
              "-instances={{ .Values.gcp.cloudsql.project_id }}:{{ .Values.gcp.cloudsql.region }}:{{ .Values.gcp.cloudsql.name }}=tcp:{{ .Values.gcp.cloudsql.port }}",
              "-credential_file=/secrets/cloudsql/credentials.json"]
    securityContext:
      runAsUser: 2
      allowPrivilegeEscalation: false
    volumeMounts:
      - name: {{ .Values.gcp.cloudsql.secretName }}
        mountPath: /secrets/cloudsql
        readOnly: true
  volumes:
    - name: {{ .Values.gcp.cloudsql.secretName }}
      secret:
        secretName: {{ .Values.gcp.cloudsql.secretName }}
{{- end }}