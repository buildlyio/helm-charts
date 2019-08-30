{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "buildlyBase.environment" -}}
- name: ALLOWED_HOSTS
  value: "*"
- name: DEFAULT_OAUTH_DOMAINS
  value: {{ .Values.defaultOauthDomains }}
- name: DJANGO_SETTINGS_MODULE
  value: buildly-api.settings.production
- name: SOCIAL_AUTH_GOOGLE_OAUTH2_KEY
  valueFrom:
    secretKeyRef:
      name: {{ template "getMainSecretsName" . }}
      key: googleOauth2Key
- name: SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ template "getMainSecretsName" . }}
      key: googleOauth2Secret
- name: SOCIAL_AUTH_LOGIN_REDIRECT_URL
  value: {{ .Values.buildly.protocol }}://{{ .Values.buildly.host }}/
- name: SOCIAL_AUTH_MICROSOFT_GRAPH_KEY
  valueFrom:
    secretKeyRef:
      name: {{ template "getMainSecretsName" . }}
      key: microsoftGraphKey
- name: SOCIAL_AUTH_MICROSOFT_GRAPH_REDIRECT_URL
  value: {{ .Values.buildly.protocol }}://{{ .Values.buildly.host }}/complete/microsoft-graph
- name: SOCIAL_AUTH_MICROSOFT_GRAPH_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ template "getMainSecretsName" . }}
      key: microsoftGraphSecret
- name: DATABASE_ENGINE
  value: postgresql
- name: DATABASE_HOST
  value: ""
- name: DATABASE_NAME
  value: "defaultdb"
- name: DATABASE_USER
  value: ""
- name: DATABASE_PASSWORD
  value: ""
- name: DATABASE_PORT
  value: "25060"
- name: DEBUG
  value: {{ if .Values.buildly.debug }} "True" {{ else }} "False" {{ end }}
- name: ALLOWED_HOSTS
  value: {{ .Values.buildly.host }}
- name: CORS_ORIGIN_WHITELIST
  value: {{ range .Values.buildly.additionalCorsOriginWhitelist }}{{ . }},{{ end }}
- name: DEFAULT_FROM_EMAIL
  value: {{ .Values.defaultFromEmail }}
- name: DEFAULT_ORG
  value: {{ .Values.defaultOrg }}
- name: DEFAULT_REPLY_TO
  value: {{ .Values.defaultReplyTo }}
- name: API_URL
  value: /api/docs
- name: DOCUMENTATION_URL
  value: http://www.github.com/buildlyio/buildly/README.md
- name: OAUTH_CLIENT_ID
  valueFrom:
    secretKeyRef:
      name: {{ template "getMainSecretsName" . }}
      key: oauthClientId
- name: OAUTH_CLIENT_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ template "getMainSecretsName" . }}
      key: oauthClientSecret
- name: PYTHONUNBUFFERED
  value: "1"
- name: SET_PROGRAM_ADMIN_DEFAULT
  value: {{ if .Values.buildly.setProgramAdminDefault }} "True" {{ else }} "False" {{ end }}
{{ template "additionalEnvironmentVariables" . }}
{{- end -}}

{{- define "additionalEnvironmentVariables" -}}
{{- with .Values.buildly.additionalEnvironmentVariables }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{- define "buildly.environment" -}}
{{ template "buildlyBase.environment" . }}
- name: CREATE_DEFAULT_PROGRAM
  value: {{ if .Values.buildly.createDefaultProgram }} "True" {{ else }} "False" {{ end }}
{{- end -}}
{{- define "buildlyRestoreInitialDemoDataCronJob.environment" -}}
{{ template "buildlyBase.environment" . }}
- name: CREATE_DEFAULT_PROGRAM
  value: "True"
{{- end -}}
{{- define "buildlyLoadInitialData.environment" -}}
{{ template "buildlyBase.environment" . }}
- name: CREATE_DEFAULT_PROGRAM
  value: {{ if .Values.buildly.createDefaultProgram }} "True" {{ else }} "False" {{ end }}
{{- end -}}
{{- define "buildlyCheckMigrationsReadyInitContainer" -}}
- name: check-migrations-ready
  image: {{ .Values.buildly.image.repository }}:{{ .Values.buildly.image.tag }}
  env:
  command:
    - /bin/sh
    - -c
    - until [ $(python manage.py showmigrations 2>1 | grep " \[.*\]" | grep -v "^ \[X\]" | wc -l) -eq 0 ];do echo waiting for migrations to be done; sleep 2; done;
{{- end -}}


{{- define "getMainSecretsName" -}}
{{- if ( eq "-" .Values.secrets) -}}
{{ .Release.Name }}-main-secrets
{{- else -}}
{{ .Values.secrets }}
{{- end -}}
{{- end -}}

{{- define "getbuildlyURL" -}}
{{ .Values.buildly.protocol }}://{{ .Values.buildly.host }}
{{- end -}}
