{{/* vim: set filetype=mustache: */}}

{{- define "buildlyTemplate.secrets" }}
  {{- $secretName := .Values.secret.name -}}
  {{- range $key, $val := .Values.secret.data }}
  - name: {{ $key }}
    valueFrom:
      secretKeyRef:
        key: {{ $key }}
        name: {{ $secretName }}
  {{- end }}
{{- end }}

{{- define "buildlyTemplate.imageUrl" }}
  {{- $framework := .Values.buildlyTemplate.framework -}}
  {{- $version := .Values.buildlyTemplate.version -}}
  "index.docker.io/buildly/buildly-{{ $framework | lower }}-template:{{ $version }}"
{{- end }}
