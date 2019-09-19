{{/* vim: set filetype=mustache: */}}

{{- define "buildlyUi.secrets" }}
  {{- $secretName := .Values.secret.name -}}
  {{- range $key, $val := .Values.secret.data }}
  - name: {{ $key }}
    valueFrom:
      secretKeyRef:
        key: {{ $key }}
        name: {{ $secretName }}
  {{- end }}
{{- end }}