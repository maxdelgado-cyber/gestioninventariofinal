# Cómo pasar y correr el proyecto en Mac (Allegra)

Si tu amigo no tiene la carpeta o no sabe cómo abrirla en la terminal, estos son los pasos para que funcione perfecto:

### PASO 0: Cómo enviarle el proyecto
No le pases la carpeta entera por Dropbox porque se corrompe. Haz esto en tu Windows:
1.  **Copia** tu carpeta `gestion inventario paomax` a otro lugar (como el Escritorio).
2.  **Entra** en esa copia y **BORRA** las carpetas `node_modules` y `.next`. (Con esto el archivo será pequeño y no tendrá "basura" de Windows).
3.  Haz click derecho en la carpeta y elige **"Comprimir en archivo ZIP"**.
4.  Envíale ese archivo `.zip` a tu amigo.

---

### PASO 1: Abrir la carpeta en Mac
Tu amigo debe hacer esto en su Mac:
1.  Descargar y **descomprimir** el `.zip`.
2.  Abrir la aplicación **Terminal** (está en Aplicaciones > Utilidades).
3.  Escribir `cd ` (fíjate que hay un espacio después del 'cd').
4.  **Arrastrar la carpeta** que descomprimió directamente dentro de la ventana de la Terminal. Se escribirá la ruta sola.
5.  Presionar **Enter**. Ahora la terminal ya estará "dentro" de la carpeta.

---

### PASO 2: Instalar y Correr (Solo la primera vez)
Una vez dentro de la terminal, debe escribir estos comandos:

```bash
# Instalar Node.js (Si no lo tiene)
# Puede bajarlo de nodejs.org

# 1. Instalar dependencias limpias para Mac
npm install

# 2. Correr la aplicación
npm run desktop
```

---

### ¿Por qué salían caracteres chinos?
Salían porque Dropbox intentó sincronizar archivos de Windows que el Mac no entiende. Al enviarle un `.zip` limpio y correr `npm install` en el Mac, se descargarán los archivos correctos automáticamente.
