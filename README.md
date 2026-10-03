# Calculadora
Calculadora financiera como proyecto
# 📈 Sistema de Análisis Financiero de Proyectos (S.A.F.)

Sistema web integral para la proyección financiera, evaluación de proyectos de inversión y simulación de escenarios económicos en tiempo real. Desarrollado para el Centro de Ciencias Económico Administrativas.

## 🚀 Descripción General
Este sistema permite a los usuarios crear proyecciones financieras a 5 años, calculando automáticamente costos de producción, inventarios, depreciación y estados financieros (Estado de Resultados y Balance General). 

Se diferencia por su **arquitectura de microservicios** y su capacidad de actualización de **precios en tiempo real** (Dólar e Inflación) mediante WebSockets.

## 🛠️ Tecnologías y Arquitectura
El proyecto utiliza una arquitectura contenerizada para garantizar la portabilidad:

* **Frontend:** HTML5, JavaScript (Vanilla), TailwindCSS, Chart.js.
* **Backend:** PHP 8.2 (con extensiones OCI8 y Sockets).
* **Base de Datos:** Oracle Database 21c Express Edition (XE).
* **Tiempo Real:** Librería Ratchet (WebSockets) + Patrón Observer.
* **Infraestructura:** Docker & Docker Compose.

## 📋 Pre-requisitos
Para ejecutar este proyecto, solo necesitas tener instalado:
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Corriendo).
* Git (Opcional, para clonar).

*Nota: No es necesario instalar PHP, Apache ni Oracle en su máquina local. Docker se encarga de todo.*

## ⚙️ Instrucciones de Instalación y Despliegue

Sigue estos pasos para levantar el entorno completo:

1.  **Clonar el repositorio:**
    Abre tu terminal y ejecuta:
    ```bash
    git clone [https://github.com/TU_USUARIO/TU_REPOSITORIO.git](https://github.com/TU_USUARIO/TU_REPOSITORIO.git)
    cd TU_REPOSITORIO
    ```

2.  **Construir y levantar los contenedores:**
    Este comando descargará las imágenes, instalará las dependencias de PHP y configurará la base de datos (esto puede tardar unos minutos la primera vez):
    ```bash
    docker-compose up -d --build
    ```

3.  **Verificar estado:**
    Asegúrate de que los contenedores estén activos:
    ```bash
    docker ps
    ```
    *Deberías ver `apache_calculadora` y `oracle_db` en estado "Up".*

## 🌐 Acceso al Sistema

Una vez que los contenedores estén arriba:

* **Aplicación Web:** Abre tu navegador en [http://localhost:8080](http://localhost:8080)
* **Gestor de Base de Datos (Opcional):**
    * Host: `localhost`
    * Puerto: `1521`
    * Usuario: `usuario_finanzas`
    * Contraseña: `admin1234`
    * Service Name: `XEPDB1`

## 📚 Documentación Técnica
La documentación completa de arquitectura, diagramas UML, justificación de patrones y matriz de trazabilidad se encuentra en la carpeta `/docs` de este repositorio o en el siguiente enlace:
* [Ver Documentación Técnica (PDF)](./docs/Documentacion_Tecnica.pdf)

## 🧪 Pruebas Rápidas
1.  Al entrar, selecciona una moneda (ej. MXN).
2.  Observa el indicador de conexión del Socket (puntito verde) en la barra superior.
3.  Crea un "Nuevo Proyecto" y llena los campos de "Mercado Meta".
4.  Guarda el proyecto y recarga la página para verificar la persistencia en Oracle.

---
**Desarrollado por:** Equipo: 
- Jose Emilio Ortega Delgado
- Cesar Eduardo Juarez Jasso 
- Jimena Diaz Esquivel
- Karlo Antonio Ordaz De Vierna
- Asesor Técnico: Dr. Carlos Argelio Arévalo Mercado
- Asesor experto Finanzas: Dra. Gloria Leticia Martell Campos
- Asesor planeación: Dra. Lizeth Itziguery Solano Romo
