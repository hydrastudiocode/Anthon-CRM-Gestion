# Anthon-Code-CRM - Gestion de Clientes
![Portada Z8N](Capturas/captura1.jpg)

![Version](https://img.shields.io/badge/version-1.0.1-blue)
![Licencia](https://img.shields.io/badge/licencia-MIT-green)
![Firebase](https://img.shields.io/badge/Firebase-9.22.0-orange)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)

**Sistema de Gestion Personal** con gestion de clientes, organizacion, notas y sistema de autenticación.

![Portada Z8N](Capturas/captura2.jpg)

## 🚀 Caracteristicas

- 🚀 **Gestion de Scripts** (###)

### 🔐 Funcionalidades

| M0dulo | Descripcion |
|--------|-------------|
| **Ver Scripts** | Grid con todos los scripts guardados |
| **Agregar Script** | Formulario para añadir nuevo codigo |
| **Editar Script** | Modificar scripts existentes |
| **Eliminar Script** | Borrar scripts con confirmacion |
| **Descargar Script** | Exportar como archivo con extension correcta |
| **Copiar Script** | Copiar contenido al portapapeles |
| **Filtro por lenguaje** | Visualizar scripts por categoria |

---

## 🛠️ Tecnologias utilizadas

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Font Awesome 6 - Iconografia
- Highlight.js - Resaltado de sintaxis
- Google Fonts (Google Sans)

### Backend (Firebase)
- Firebase Authentication - Gestion de usuarios
- Cloud Firestore - Base de datos

### Herramientas
- Git & GitHub - Control de versiones
- Netlify / Vercel - Despliegue continuo

---

## 🔧 Instalacion y Configuracion para Nuevos Usuarios

### Requisitos Previos

1. Una cuenta de [Firebase](https://firebase.google.com/)
2. Un proyecto creado en Firebase Console
3. Git instalado (opcional, para clonar)

### Paso 1: Clonar o descargar el proyecto

git clone https://github.com/tuusuario/AnthonCode-1.0.1.git

### Paso 2: Configurar Firebase
2.1 Crear proyecto en Firebase
Ve a Firebase Console

Haz clic en "Crear proyecto"
Asigna un nombre (ej: "anthon-code")
Haz clic en "Crear proyecto"

### 2.2 Habilitar Authentication
En el menu izquierdo, ve a "Build" → "Authentication"

Haz clic en "Empezar"
Ve a la pestaña "Sign-in method"
Habilita "Email/Password"
Guarda los cambios

### 2.3 Crear Firestore Database
Ve a "Build" → "Firestore Database"

Haz clic en "Crear base de datos"
Selecciona "Iniciar en modo de prueba" (luego cambiaras las reglas)
Selecciona la region mas cercana
Haz clic en "Habilitar"

### 2.4 Configurar Reglas de Firestore
En la pestaña "Rules" de Firestore Database, pega las reglas segun la seguridad que desees implementar:
 -  [Reglas V.1](Rulesv1.txt)
 -  [Reglas V.2](Rulesv2.txt)

### 2.5 Obtener configuracion de Firebase
Ve a "Project Overview" (icono de ajustes ⚙️)

Haz clic en el ícono "</>" (Agregar Firebase a tu app web)
Registra la app con un nombre (ej: "anthon-code")
Copia el objeto firebaseConfig que se muestra 

### Paso 3: Configurar el archivo firebase-config.js
Abre js/firebase-config.js y reemplaza con TU configuracion:

- const firebaseConfig = {
-  apiKey: "TU_API_KEY",
-  authDomain: "TU_PROYECTO.firebaseapp.com",
-  projectId: "TU_PROYECTO",
-  storageBucket: "TU_PROYECTO.firebasestorage.app",
-  messagingSenderId: "TU_SENDER_ID",
-  appId: "TU_APP_ID",
-  measurementId: "TU_MEASUREMENT_ID"

### Paso 4: Probar localmente y Desplegar
Debido a los módulos ES6, necesitas un servidor local: Live Server, Python, Nodejs
-  python -m http.server 8000

### Abre http://localhost:8000
Luego de todas las verificaciones desplega en Netlify, Vercel o GitHub.

Muchas Gracias! sigan  [Hydra Studio Code](https://github.com/hydrastudiocode)
