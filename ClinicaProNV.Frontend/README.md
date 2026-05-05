# ClinicaProNV Frontend

Frontend React + Vite para el sistema ClinicaProNV.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## API

Por defecto el cliente usa `/api` y el servidor de Vite redirige al backend en `http://localhost:5000`.

Para apuntar a otra API, define:

```bash
VITE_API_URL=http://localhost:5000/api
```

## Módulos

- Autenticación y registro.
- Dashboard con módulos por rol.
- Pacientes, doctores, citas e historias clínicas.
- Facturación clínica con detalle e impresión.
- Farmacia con inventario y venta de medicamentos.
- Administración de usuarios, roles y estado de acceso.

## WhatsApp automático

El backend está preparado para WhatsApp Business Cloud API. Se configura en `ClinicaProNV.Api/appsettings.json`:

```json
"WhatsApp": {
  "Enabled": true,
  "GraphApiVersion": "v20.0",
  "PhoneNumberId": "ID_DEL_NUMERO_DE_META",
  "AccessToken": "TOKEN_DE_META",
  "LanguageCode": "es",
  "Templates": {
    "AppointmentCreated": "cita_creada",
    "ClinicInvoiceCreated": "factura_clinica",
    "PharmacyInvoiceCreated": "factura_farmacia"
  }
}
```

Plantillas esperadas:

- `cita_creada`: paciente, doctor, fecha, motivo.
- `factura_clinica`: paciente, factura, fecha, total.
- `factura_farmacia`: paciente, factura, fecha, total.

También existe un endpoint de prueba para Admin:

`POST /api/notifications/whatsapp/test`
