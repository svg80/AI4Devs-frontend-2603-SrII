Open Code - DeepSeek V4 Flash Free

# Prompt 1 - inicializar el contexto

```text
/init
```

# Prompt 2 - Documentación de la api y api-docs

```text
where can i find the definition in swagger for this app? Is in api docs? Can you fix ths an apply the wiring to visually identify the route api-docs?
```

# Prompt 3 - Rule para leer siempre de openapi 

```text
Include a new rule in the folder .opencode/rules touse always de standar openapi with swagger to read documentation of endponints
```

# Prompt 4 - Rule para usar siempre el lenguaje del repo
```text
Include a new rule in the folder .opencode/rules to use the language used in this repo
``` 

# Prompt 5 - Generar un prompt para crear una skill de frontend developer 
```text
Generate a prompt in the folder @prompts/prompts-svg/ where I want to generate a frontend software senior developer with the best practices. The skill must be placed in the .opencode/skills. This skill will be used from a sub-agent. Do not include the actual skill, only generate the best prompt possible to be execute to achive de goal. 
``` 

# Prompt 6 - Ejecutar el prompt que genera la skill
```text
execute prompt @prompts/prompts-svg/create-frontend-skill.md
``` 

# Prompt 7 - Generar el agente que usa la skill
```text
Generate a brand new prompt in the folder @prompts/prompts-svg/ to create a new sub-agent in the folder @.opencode/agents. That agent will be using the skill @.opencode/skills/frontend-senior/
``` 

# Prompt 8 - Ejecutar el prompt que genera el sub-agente
```text
execute prompt @prompts/prompts-svg/create-frontend-agent.md
``` 

# Prompt 9- Genear una rule para indicarle cuál es la epic que debe tener en cuenta 
```text
Add a new rule in @.opencode/rules/ to always take into account the epic describe in @task/creando_interfaz_gestion_aplicaciones_LTI.md
``` 

# Prompt 10 - Crear una skill de PO que sepa cómo dividir una epic en tareas atómicas
```text
Generate a brand new prompt in the folder @prompts/prompts-svg/ to create a skill with the best practices for a product owner manager than knows how the epic must be divided into atomic tasks. The epic are in folder @task. The skill must create ang mangate atomic task in a subfolder into the task folder.
``` 

# Prompt 11 - Ejecutar el prompt que genera el skill
```text
execute prompt @prompts/prompts-svg/create-product-owner-skill.md
``` 

# Prompt 12 - Prompt para crear sub-agente PO 
```text
Generate a new prompt in the folder @prompts/prompts-svg/ to create a sub-agent in the folder @.opencode/agents. That agent will be using the skill @.opencode/skills/product-owner/. Use the best practices of prompt. Do not create the subagent, only them prompt. 
``` 

# Prompt 13 - Ejecutar el prompt que genera el sub-agente
```text
execute prompt @prompts/prompts-svg/create-product-owner-agent.md
``` 

# Prompt 14 - Generar prompt para un comando enriquecer ticket
```text
Generate a new prompt in the folder @prompts/prompts-svg/ to create a command in the folder @.opencode/commands. That command will be using the agent @.opencode/agents/product-owner/. The command knows TDD and how to enrich given tickets/subtask. Use the best practices of prompt. Do not create the command, only them prompt.
``` 

# Prompt 15  - Ejecutar el prompt que genera el comando
```text
execute prompt @prompts/prompts-svg/create-enrich-ticket-command.md
``` 

# Prompt 16 - Modificar skills para que usen o tengan en cuenta las rules 
```text
Modify all @.opencode/skills/ to use or take in account rules in @.opencode/rules/
``` 

# Prompt 17 - Generar prompt para un comando que implemente ticket
```text
Generate a new prompt in the folder @prompts/prompts-svg/ to create a command in the folder @.opencode/commands. That command will be using the agent @.opencode/agents/frontend-dev/. The command knows how to develop given tickets/subtask and add the description of the PR in @task/pr_description.md. Use the best practices of prompt. Do not create the command, only them prompt.
``` 

# Prompt 18 - Ejecutar el prompt que genera el comando
```text
execute prompt @prompts/prompts-svg/create-develop-ticket-command.md
``` 

# Prompt 19 - Usar skill product-owner para dividir la tarea solicitada en tareas subatómicas
```text
/product-owner @task/creando_interfaz_gestion_aplicaciones_LTI.md
``` 

# Prompt 20 - Enriquecer la tarea 001
```text
/enrich-ticket @task/creando-interfaz-gestion-aplicaciones-lti/001-setup-ruta-y-tablero-kanban.md 
``` 

# Prompt 21 - Enriquecer la tarea 002
```text
/enrich-ticket /enrich-ticket @task/creando-interfaz-gestion-aplicaciones-lti/002-renderizar-tarjetas-de-candidatos.md  
``` 

# Prompt 22 - Enriquecer la tarea 003
```text
/enrich-ticket @task/creando-interfaz-gestion-aplicaciones-lti/003-implementar-arrastre-y-actualizacion.md  
``` 

# Prompt 23 - Enriquecer la tarea 004
```text
/enrich-ticket /enrich-ticket @task/creando-interfaz-gestion-aplicaciones-lti/004-layout-responsivo-movil.md  
``` 

# Prompt 24 - Generar un prompt para crear una skill de backend developer 
```text
Generate a prompt in the folder @prompts/prompts-svg/ where I want to generate a backend software senior developer with the best practices. The skill must be placed in the .opencode/skills. This skill will be used from a sub-agent. Do not include the actual skill, only generate the best prompt possible to be execute to achive de goal. 
``` 

# Prompt 25 - Ejecutar el prompt que genera la skill
```text
execute prompt @prompts/prompts-svg/create-backend-skill.md
``` 

# Prompt 26 - Generar el agente que usa la skill
```text
Generate a brand new prompt in the folder @prompts/prompts-svg/ to create a new subagent in the folder @.opencode/agents. That agent will be using the skill @.opencode/skills/backend-senior/
``` 

# Prompt 27 - Modificar prompts y skill para usar TDD en lugar de BDD  
```text
Modify @prompts/prompts-svg/create-backend-skill.md @prompts/prompts-svg/create-backend-agent.md and @.opencode/skills/backend-senior/ to use TDD instead of BDD
``` 

# Prompt 28 - Ejecutar el prompt que genera el sub-agente
```text
execute prompt @prompts/prompts-svg/create-backend-agent.md
``` 

# Prompt 29 - Generar prompt para un comando que implemente ticket de backend
```text
Generate a new prompt in the folder @prompts/prompts-svg/ to create a command in the folder @.opencode/commands. That command will be using the agent @.opencode/agents/backend-dev.md. The command knows how to develop given tickets/subtask and add the description of the PR in @task/pr_description.md. Use the best practices of prompt. Do not create the command, only them prompt.
``` 

# Prompt 30 - Ejecutar el prompt que genera el comando de backend dev
```text
execute prompt @prompts/prompts-svg/create-backend-develop-ticket-command.md
``` 

# Prompt 31 - Implementar tarea 1 
```text
/develop-ticket @task/creando-interfaz-gestion-aplicaciones-lti/001-setup-ruta-y-tablero-kanban.enriched.md
```

# Prompt 32 - Corrección de errores detectados tras implementación de tarea 1
```text
I don't see nothing when I go to localhost:3000
``` 

```text
The button 'Ver proceso' in cards in localhost:3000/position don't work
```

# Prompt 33 - Implementar tarea 2 
```text
/develop-ticket @task/creando-interfaz-gestion-aplicaciones-lti/002-renderizar-tarjetas-de-candidatos.enriched.md
``` 

# Prompt 34 - Crear tarea para extener `GET /position/:id/candidates`
````text
Before implementing ticket 003, the backend team must extend the `GET /position/:id/candidates` response to include the `id` and `applicationId`:
```json
{
"id": 1,
"applicationId": 1,
"fullName": "Jane Smith",
"currentInterviewStep": "Technical Interview",
"averageScore": 4
}
```
Create a new task in `@task/creando-interfaz-gestion-aplicaciones-lti/002.5-extend-response-get-position-id-candidates.md` to specify the task as outlined in `@task/creando-interfaz-gestion-aplicaciones-lti/003-implementar-arrastre-y-actualizacion.enriched.md`
````

# Prompt 35 - Enriquecer tarea anterior
```text
/enrich-ticket @task/creando-interfaz-gestion-aplicaciones-lti/002.5-extend-response-get-position-id-candidates.md 
``` 

# Prompt 36 - Implementar tarea de back 
```text
/develop-backend-ticket @task/creando-interfaz-gestion-aplicaciones-lti/002.5-extend-response-get-position-id-candidates.enriched.md  and update @task/creando-interfaz-gestion-aplicaciones-lti/003-implementar-arrastre-y-actualizacion.enriched.md 
``` 

# Prompt 37 - Implementar tarea de back 
```text
/develop-ticket @task/creando-interfaz-gestion-aplicaciones-lti/003-implementar-arrastre-y-actualizacion.enriched.md. Note that the backend team has extended the `GET /position/:id/candidates` response with id and applicationId
```