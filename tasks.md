# Tareas del Proyecto POS Finanzas

## 🧪 ESTRATEGIA COMPLETA: Alcanzar 70% de Cobertura de Pruebas (21 Ene 2026)

### Descripción del Objetivo

Implementar una estrategia integral de testing para alcanzar el objetivo de **70% de cobertura** documentado en el requerimiento no funcional RNF007. Este plan abarca pruebas unitarias, de integración y end-to-end para backend, frontend y servicio ML.

**ESTADO ACTUAL:**
- Backend: ~5% de cobertura (2 archivos de test)
- Frontend: 0% de cobertura (sin framework configurado)
- ML Service: 0% de pruebas unitarias (solo scripts manuales)

**OBJETIVO:**
- Backend: 70% de cobertura mínima
- Frontend: 70% de cobertura mínima
- ML Service: 70% de cobertura mínima

### Análisis de Situación Actual

#### ✅ Aspectos Positivos:
1. **Calidad de Datos ML**: Implementación excelente de ISO/IEC 25012
2. **Infraestructura Base**: H2 configurada, dependencias en `pom.xml`
3. **Ejemplo Funcional**: `DeudasProveedoresServiceTest.java` bien implementado
4. **Scripts ML**: Testing manual funcional para integración

#### ⚠️ Problemas Críticos:
1. **Tests deshabilitados en Backend**: `<skip>true</skip>` en `pom.xml`
2. **Frontend sin framework**: Ni Jest, ni Vitest configurados
3. **Cobertura insuficiente**: 65 puntos porcentuales por debajo del objetivo
4. **Sin pruebas E2E**: Flujos críticos sin verificación automatizada

---

## 📋 PLAN DE IMPLEMENTACIÓN

### FASE 1: Configuración de Infraestructura de Testing (Prioridad: CRÍTICA)

#### Backend: Habilitar y Configurar Testing

- [ ] **Paso 1.1: Habilitar compilación de tests**
  - [ ] Abrir `backend/pom.xml`
  - [ ] Remover o comentar el bloque `<skip>true</skip>` en la configuración de maven-surefire-plugin
  - [ ] Verificar que las dependencias de testing estén presentes:
    - `spring-boot-starter-test`
    - `spring-security-test`
    - `h2` (scope: test)
  - [ ] Ejecutar `./mvnw test` para verificar que los tests existentes corran

- [ ] **Paso 1.2: Configurar JaCoCo para medición de cobertura**
  - [ ] Añadir plugin JaCoCo en `pom.xml`:
    ```xml
    <plugin>
        <groupId>org.jacoco</groupId>
        <artifactId>jacoco-maven-plugin</artifactId>
        <version>0.8.11</version>
        <executions>
            <execution>
                <goals>
                    <goal>prepare-agent</goal>
                </goals>
            </execution>
            <execution>
                <id>report</id>
                <phase>test</phase>
                <goals>
                    <goal>report</goal>
                </goals>
            </execution>
        </executions>
    </plugin>
    ```
  - [ ] Ejecutar `./mvnw clean test jacoco:report`
  - [ ] Verificar que se genere reporte en `target/site/jacoco/index.html`
  - [ ] Documentar cobertura actual como baseline

- [ ] **Paso 1.3: Configurar perfiles de testing**
  - [ ] Verificar que `application-test.properties` esté correctamente configurado
  - [ ] Crear `data-test.sql` con datos de prueba mínimos si no existe
  - [ ] Asegurar que H2 esté configurada en modo PostgreSQL

#### Frontend: Instalar y Configurar Framework de Testing

- [ ] **Paso 1.4: Instalar Vitest y dependencias**
  - [ ] Navegar a `frontend/`
  - [ ] Ejecutar:
    ```bash
    npm install -D vitest @vitest/ui @vitest/coverage-v8
    npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
    npm install -D jsdom
    ```
  - [ ] Verificar que las dependencias se añadan a `package.json`

- [ ] **Paso 1.5: Crear configuración de Vitest**
  - [ ] Crear archivo `frontend/vitest.config.ts`:
    ```typescript
    import { defineConfig } from 'vitest/config'
    import react from '@vitejs/plugin-react'
    
    export default defineConfig({
      plugins: [react()],
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html'],
          exclude: [
            'node_modules/',
            'src/test/',
            '**/*.d.ts',
            '**/*.config.*',
            '**/mockData',
            'src/main.tsx',
          ],
          thresholds: {
            lines: 70,
            functions: 70,
            branches: 70,
            statements: 70,
          },
        },
      },
    })
    ```

- [ ] **Paso 1.6: Crear archivo de setup de testing**
  - [ ] Crear carpeta `frontend/src/test/`
  - [ ] Crear archivo `frontend/src/test/setup.ts`:
    ```typescript
    import { expect, afterEach } from 'vitest'
    import { cleanup } from '@testing-library/react'
    import * as matchers from '@testing-library/jest-dom/matchers'
    
    expect.extend(matchers)
    
    afterEach(() => {
      cleanup()
    })
    ```

- [ ] **Paso 1.7: Añadir scripts de testing a package.json**
  - [ ] Añadir en la sección `"scripts"`:
    ```json
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
    ```

- [ ] **Paso 1.8: Verificar instalación**
  - [ ] Ejecutar `npm test -- --version`
  - [ ] Verificar que Vitest se ejecute sin errores

#### ML Service: Configurar pytest

- [ ] **Paso 1.9: Instalar pytest y dependencias**
  - [ ] Navegar a `ml-prediction-service/`
  - [ ] Añadir a `requirements.txt`:
    ```
    pytest==7.4.3
    pytest-cov==4.1.0
    pytest-asyncio==0.21.1
    httpx==0.25.2
    ```
  - [ ] Ejecutar `pip install -r requirements.txt`

- [ ] **Paso 1.10: Crear configuración de pytest**
  - [ ] Crear archivo `ml-prediction-service/pytest.ini`:
    ```ini
    [pytest]
    testpaths = tests
    python_files = test_*.py
    python_classes = Test*
    python_functions = test_*
    addopts = 
        --verbose
        --cov=app
        --cov-report=html
        --cov-report=term
        --cov-fail-under=70
    ```

- [ ] **Paso 1.11: Crear estructura de carpetas de tests**
  - [ ] Crear carpeta `ml-prediction-service/tests/`
  - [ ] Crear archivo `ml-prediction-service/tests/__init__.py` vacío
  - [ ] Crear carpeta `ml-prediction-service/tests/unit/`
  - [ ] Crear carpeta `ml-prediction-service/tests/integration/`

---

### FASE 2: Pruebas Unitarias Backend (Prioridad: ALTA)

**Objetivo**: Alcanzar 40% de cobertura implementando tests de servicios críticos

#### Services: Capa de Lógica de Negocio

- [ ] **Paso 2.1: Test de InventarioService**
  - [ ] Crear `backend/src/test/java/.../service/InventarioServiceTest.java`
  - [ ] Implementar tests para:
    - `getAllProductos()` - Lista de productos
    - `getProductoById(id)` - Obtener producto por ID
    - `createProducto(dto)` - Crear producto
    - `updateProducto(id, dto)` - Actualizar producto
    - `deleteProducto(id)` - Eliminar (desactivar) producto
    - `getProductosByCategoria(categoria)` - Filtrar por categoría
    - `getProductosConStockBajo()` - Alertas de stock
  - [ ] Usar Mockito para mockear repositories
  - [ ] Verificar manejo de excepciones

- [ ] **Paso 2.2: Test de VentasService / OrdenesDeVentasService**
  - [ ] Crear `OrdenesDeVentasServiceTest.java`
  - [ ] Implementar tests para:
    - `crearOrdenDeVenta(dto)` - Crear orden
    - `agregarProductoAOrden(ordenId, productoId, cantidad)` - Añadir producto
    - `calcularTotalOrden(ordenId)` - Calcular total
    - `finalizarOrden(ordenId)` - Finalizar orden
    - `getOrdenesByUsuario(usuarioId)` - Órdenes por usuario
    - `getOrdenesRecientes(limit)` - Órdenes recientes
  - [ ] Verificar actualización de inventario
  - [ ] Verificar cálculos de totales

- [ ] **Paso 2.3: Test de ComprasService / OrdenesWorkspaceService**
  - [ ] Crear `OrdenesWorkspaceServiceTest.java`
  - [ ] Implementar tests para:
    - `crearOrdenCompra(dto)` - Crear orden de compra
    - `agregarProductoAOrdenWorkspace(workspaceId, productoId, cantidad)` - Añadir producto
    - `incrementarInventario(productoId, cantidad)` - Incrementar stock
    - `finalizarOrdenWorkspace(workspaceId)` - Finalizar orden
  - [ ] Verificar incremento de inventario
  - [ ] Verificar estados de workspace

- [ ] **Paso 2.4: Test de AuthService / UsuariosService**
  - [ ] Crear `UsuariosServiceTest.java`
  - [ ] Implementar tests para:
    - `createUsuario(dto)` - Crear usuario
    - `updateUsuario(id, dto)` - Actualizar usuario
    - `findByNombre(nombre)` - Buscar por nombre
    - `validatePassword(usuario, password)` - Validar contraseña
    - `changePassword(usuarioId, oldPassword, newPassword)` - Cambiar contraseña
  - [ ] Verificar encriptación de contraseñas
  - [ ] Verificar validaciones

- [ ] **Paso 2.5: Test de PersonaService / EmpleadoService**
  - [ ] Crear `PersonaServiceTest.java`
  - [ ] Crear `EmpleadoServiceTest.java`
  - [ ] Implementar tests básicos CRUD

#### Verificación de Cobertura Fase 2

- [ ] **Paso 2.6: Medir cobertura después de tests de servicios**
  - [ ] Ejecutar `./mvnw clean test jacoco:report`
  - [ ] Abrir `target/site/jacoco/index.html`
  - [ ] Verificar que cobertura esté ≥ 40%
  - [ ] Documentar resultados

---

### FASE 3: Pruebas de Integración Backend (Prioridad: ALTA)

**Objetivo**: Alcanzar 55% de cobertura implementando tests de controllers

#### Controllers: Capa de API REST

- [ ] **Paso 3.1: Test de AuthController**
  - [ ] Crear `backend/src/test/java/.../controller/AuthControllerTest.java`
  - [ ] Usar `@SpringBootTest` y `MockMvc`
  - [ ] Implementar tests para:
    - `POST /api/auth/login` - Login exitoso
    - `POST /api/auth/login` - Login con credenciales incorrectas
    - `POST /api/auth/login` - Login con usuario inexistente
    - `POST /api/auth/register` - Registro exitoso
    - `POST /api/auth/register` - Registro con datos inválidos
  - [ ] Verificar respuesta HTTP 200/400/401
  - [ ] Verificar generación de JWT token

- [ ] **Paso 3.2: Test de InventarioController**
  - [ ] Crear `InventarioControllerTest.java`
  - [ ] Implementar tests para:
    - `GET /api/productos` - Obtener todos los productos
    - `GET /api/productos/{id}` - Obtener producto por ID
    - `POST /api/productos` - Crear producto (requiere auth)
    - `PUT /api/productos/{id}` - Actualizar producto (requiere auth)
    - `DELETE /api/productos/{id}` - Eliminar producto (requiere auth)
  - [ ] Verificar validación de DTOs
  - [ ] Verificar seguridad (endpoints protegidos)

- [ ] **Paso 3.3: Test de OrdenesDeVentasController**
  - [ ] Crear `OrdenesDeVentasControllerTest.java`
  - [ ] Implementar tests para endpoints críticos
  - [ ] Verificar flujo completo de venta

- [ ] **Paso 3.4: Test de OrdenesWorkspaceController**
  - [ ] Crear `OrdenesWorkspaceControllerTest.java`
  - [ ] Implementar tests para gestión de workspaces
  - [ ] Verificar estados de ocupación

#### Configuración de Seguridad en Tests

- [ ] **Paso 3.5: Configurar Spring Security Test**
  - [ ] Crear clase de utilidad `TestSecurityConfig.java`
  - [ ] Implementar método para generar tokens JWT de prueba
  - [ ] Crear anotación personalizada `@WithMockJWT` si es necesario

#### Verificación de Cobertura Fase 3

- [ ] **Paso 3.6: Medir cobertura después de tests de controllers**
  - [ ] Ejecutar `./mvnw clean test jacoco:report`
  - [ ] Verificar que cobertura esté ≥ 55%
  - [ ] Identificar áreas con baja cobertura

---

### FASE 4: Pruebas de Repositories Backend (Prioridad: MEDIA)

**Objetivo**: Alcanzar 65% de cobertura implementando tests de consultas JPA

#### Repositories: Capa de Acceso a Datos

- [ ] **Paso 4.1: Test de ProductosRepository**
  - [ ] Crear `ProductosRepositoryTest.java`
  - [ ] Usar `@DataJpaTest` para tests de repository
  - [ ] Implementar tests para:
    - `findByNombre(nombre)` - Buscar por nombre
    - `findByCategoriaId(categoriaId)` - Filtrar por categoría
    - `findByProveedorId(proveedorId)` - Filtrar por proveedor
    - Consultas personalizadas con `@Query`
  - [ ] Verificar integridad de datos

- [ ] **Paso 4.2: Test de UsuariosRepository**
  - [ ] Crear `UsuariosRepositoryTest.java`
  - [ ] Implementar tests para:
    - `findByNombre(nombre)` - Buscar usuario por nombre
    - `findByNombreIgnoreCase(nombre)` - Buscar case-insensitive
    - `existsByNombre(nombre)` - Verificar existencia
  - [ ] Verificar consultas custom

- [ ] **Paso 4.3: Test de OrdenesDeVentasRepository**
  - [ ] Crear `OrdenesDeVentasRepositoryTest.java`
  - [ ] Implementar tests para consultas complejas
  - [ ] Verificar joins con otras tablas

#### Verificación de Cobertura Fase 4

- [ ] **Paso 4.4: Medir cobertura después de tests de repositories**
  - [ ] Ejecutar `./mvnw clean test jacoco:report`
  - [ ] Verificar que cobertura esté ≥ 65%

---

### FASE 5: Pruebas Unitarias Frontend (Prioridad: ALTA)

**Objetivo**: Alcanzar 40% de cobertura implementando tests de componentes críticos

#### Componentes de Autenticación

- [ ] **Paso 5.1: Test de LoginScreen**
  - [ ] Crear `frontend/src/components/LoginScreen.test.tsx`
  - [ ] Implementar tests para:
    - Renderizado inicial del formulario
    - Validación de campos vacíos
    - Submit con credenciales válidas
    - Manejo de errores de login
    - Navegación después de login exitoso
  - [ ] Mockear `AuthContext` y `apiService`

- [ ] **Paso 5.2: Test de AuthContext**
  - [ ] Crear `frontend/src/contexts/AuthContext.test.tsx`
  - [ ] Implementar tests para:
    - Inicialización del contexto
    - Función `login()` exitosa
    - Función `logout()` limpia estado
    - Persistencia de token en localStorage
    - Verificación de token expirado

#### Servicios API

- [ ] **Paso 5.3: Test de apiService**
  - [ ] Crear `frontend/src/services/apiService.test.ts`
  - [ ] Mockear axios con `vi.mock('axios')`
  - [ ] Implementar tests para:
    - Configuración de headers con token
    - Manejo de errores 401 (unauthorized)
    - Manejo de errores 500 (server error)
    - Manejo de errores de red

- [ ] **Paso 5.4: Test de inventarioService**
  - [ ] Crear `frontend/src/services/inventarioService.test.ts`
  - [ ] Implementar tests para:
    - `getProductos()` - Obtener productos
    - `createProducto(dto)` - Crear producto
    - `updateProducto(id, dto)` - Actualizar producto
    - `deleteProducto(id)` - Eliminar producto
  - [ ] Verificar transformación de DTOs

- [ ] **Paso 5.5: Test de mlService**
  - [ ] Crear `frontend/src/services/mlService.test.ts`
  - [ ] Implementar tests para:
    - `getPredictions(data)` - Obtener predicciones
    - Manejo de timeout
    - Fallback a datos dummy

#### Componentes de Negocio Críticos

- [ ] **Paso 5.6: Test de PuntoDeVenta**
  - [ ] Crear `frontend/src/components/PuntoDeVenta.test.tsx`
  - [ ] Implementar tests para:
    - Renderizado inicial de productos
    - Añadir producto al carrito
    - Incrementar/decrementar cantidad
    - Calcular total correctamente
    - Guardar orden exitosamente
    - Manejo de productos sin stock
  - [ ] Mockear servicios de ventas

- [ ] **Paso 5.7: Test de Inventario**
  - [ ] Crear `frontend/src/components/Inventario.test.tsx`
  - [ ] Implementar tests para:
    - Renderizado de tabla de productos
    - Búsqueda y filtrado
    - Abrir modal de crear producto
    - Abrir modal de editar producto
    - Eliminar producto con confirmación
  - [ ] Mockear inventarioService

#### Hooks Personalizados

- [ ] **Paso 5.8: Test de useAuth**
  - [ ] Crear `frontend/src/hooks/useAuth.test.ts`
  - [ ] Implementar tests para lógica del hook

- [ ] **Paso 5.9: Test de useToast**
  - [ ] Crear `frontend/src/hooks/useToast.test.ts`
  - [ ] Implementar tests para notificaciones

#### Verificación de Cobertura Fase 5

- [ ] **Paso 5.10: Medir cobertura del frontend**
  - [ ] Ejecutar `npm run test:coverage`
  - [ ] Abrir `coverage/index.html`
  - [ ] Verificar que cobertura esté ≥ 40%

---

### FASE 6: Pruebas de Componentes Frontend Adicionales (Prioridad: MEDIA)

**Objetivo**: Alcanzar 60% de cobertura implementando tests de componentes secundarios

#### Componentes de Gestión

- [ ] **Paso 6.1: Test de GestionEmpleados**
  - [ ] Crear `GestionEmpleados.test.tsx`
  - [ ] Implementar tests básicos CRUD

- [ ] **Paso 6.2: Test de GestionPersonas**
  - [ ] Crear `GestionPersonas.test.tsx`
  - [ ] Implementar tests básicos CRUD

- [ ] **Paso 6.3: Test de DeudasProveedores**
  - [ ] Crear `DeudasProveedores.test.tsx`
  - [ ] Implementar tests de cálculos

- [ ] **Paso 6.4: Test de PuntoDeCompras**
  - [ ] Crear `PuntoDeCompras.test.tsx`
  - [ ] Implementar tests de flujo de compras

#### Componentes de UI Compartidos

- [ ] **Paso 6.5: Test de SidebarNavigation**
  - [ ] Crear `SidebarNavigation.test.tsx`
  - [ ] Implementar tests para:
    - Renderizado de enlaces
    - Estado activo correcto
    - Navegación al hacer click
    - Botón de logout

- [ ] **Paso 6.6: Test de MainMenu**
  - [ ] Crear `MainMenu.test.tsx`
  - [ ] Implementar tests de dashboard

- [ ] **Paso 6.7: Test de Modales**
  - [ ] Crear `ModalCrearProducto.test.tsx`
  - [ ] Crear `ModalEditarProducto.test.tsx`
  - [ ] Crear `ModalPredicciones.test.tsx`
  - [ ] Implementar tests de renderizado y validación

#### Verificación de Cobertura Fase 6

- [ ] **Paso 6.8: Medir cobertura después de componentes adicionales**
  - [ ] Ejecutar `npm run test:coverage`
  - [ ] Verificar que cobertura esté ≥ 60%

---

### FASE 7: Pruebas Unitarias ML Service (Prioridad: ALTA)

**Objetivo**: Alcanzar 50% de cobertura implementando tests de lógica de predicción

#### Tests de API

- [ ] **Paso 7.1: Test de endpoints FastAPI**
  - [ ] Crear `ml-prediction-service/tests/integration/test_api.py`
  - [ ] Usar `TestClient` de FastAPI
  - [ ] Implementar tests para:
    - `GET /` - Health check
    - `GET /health` - Health status
    - `POST /predict` - Predicción exitosa
    - `POST /predict` - Predicción con datos inválidos
  - [ ] Verificar estructura de respuesta JSON

#### Tests de Pipeline de Datos

- [ ] **Paso 7.2: Test de feature engineering**
  - [ ] Crear `ml-prediction-service/tests/unit/test_pipeline.py`
  - [ ] Implementar tests para:
    - Transformación de datos de entrada
    - Generación de características temporales
    - Manejo de valores faltantes
    - Validación de tipos de datos
  - [ ] Verificar que las features generadas sean correctas

- [ ] **Paso 7.3: Test de predictor**
  - [ ] Crear `ml-prediction-service/tests/unit/test_predictor.py`
  - [ ] Implementar tests para:
    - Carga correcta de modelos
    - Predicción con datos válidos
    - Manejo de errores de predicción
    - Formato de salida correcto

#### Tests de Calidad de Datos

- [ ] **Paso 7.4: Test de data_quality_analyzer**
  - [ ] Crear `ml-prediction-service/tests/unit/test_data_quality_analyzer.py`
  - [ ] Implementar tests para:
    - Detección de valores faltantes
    - Detección de outliers
    - Análisis de distribución
    - Generación de reporte

#### Verificación de Cobertura Fase 7

- [ ] **Paso 7.5: Medir cobertura de ML Service**
  - [ ] Ejecutar `pytest --cov=app --cov-report=html`
  - [ ] Abrir `htmlcov/index.html`
  - [ ] Verificar que cobertura esté ≥ 50%

---

### FASE 8: Pruebas End-to-End (E2E) (Prioridad: MEDIA)

**Objetivo**: Verificar flujos críticos de usuario completos

#### Configuración de Cypress/Playwright

- [ ] **Paso 8.1: Instalar Cypress**
  - [ ] Navegar a `frontend/`
  - [ ] Ejecutar `npm install -D cypress`
  - [ ] Ejecutar `npx cypress open` para inicializar
  - [ ] Configurar `cypress.config.ts`

- [ ] **Paso 8.2: Configurar base URL y comandos personalizados**
  - [ ] Configurar `baseUrl` en `cypress.config.ts`
  - [ ] Crear comandos personalizados en `cypress/support/commands.ts`:
    - `cy.login(nombre, password)` - Login automatizado
    - `cy.logout()` - Logout automatizado

#### Flujos Críticos de Negocio

- [ ] **Paso 8.3: E2E de flujo de login**
  - [ ] Crear `cypress/e2e/auth.cy.ts`
  - [ ] Implementar test:
    - Visitar página de login
    - Ingresar credenciales
    - Verificar redirección a dashboard
    - Verificar que token se guarde

- [ ] **Paso 8.4: E2E de flujo de venta completo**
  - [ ] Crear `cypress/e2e/ventas.cy.ts`
  - [ ] Implementar test:
    - Login como usuario
    - Navegar a POS
    - Seleccionar workspace
    - Añadir productos al carrito
    - Verificar cálculo de total
    - Guardar orden
    - Verificar actualización de stock

- [ ] **Paso 8.5: E2E de gestión de inventario**
  - [ ] Crear `cypress/e2e/inventario.cy.ts`
  - [ ] Implementar test:
    - Login como admin
    - Navegar a inventario
    - Crear nuevo producto
    - Editar producto
    - Verificar cambios en tabla
    - Eliminar producto

- [ ] **Paso 8.6: E2E de predicciones ML**
  - [ ] Crear `cypress/e2e/predicciones.cy.ts`
  - [ ] Implementar test:
    - Login como usuario
    - Navegar a inventario
    - Abrir modal de predicciones
    - Verificar carga de predicciones
    - Crear orden de compra desde predicciones

#### Verificación E2E

- [ ] **Paso 8.7: Ejecutar suite completa E2E**
  - [ ] Ejecutar `npx cypress run`
  - [ ] Verificar que todos los tests pasen
  - [ ] Capturar screenshots de fallos

---

### FASE 9: Optimización y Alcance de Objetivo 70% (Prioridad: ALTA)

**Objetivo**: Análisis de cobertura y implementación de tests faltantes

#### Análisis de Cobertura Global

- [ ] **Paso 9.1: Generar reportes de cobertura de todos los servicios**
  - [ ] Backend: `./mvnw clean test jacoco:report`
  - [ ] Frontend: `npm run test:coverage`
  - [ ] ML Service: `pytest --cov=app --cov-report=html`
  - [ ] Consolidar métricas en un documento

- [ ] **Paso 9.2: Identificar áreas con baja cobertura**
  - [ ] Revisar reporte JaCoCo del backend
  - [ ] Revisar reporte de Vitest del frontend
  - [ ] Revisar reporte de pytest del ML Service
  - [ ] Listar clases/funciones con <50% de cobertura

- [ ] **Paso 9.3: Priorizar implementación de tests faltantes**
  - [ ] Crear lista de archivos críticos sin tests
  - [ ] Implementar tests adicionales enfocados en:
    - Ramas no cubiertas (if/else)
    - Manejo de excepciones
    - Casos edge (valores límite, nulos, vacíos)

#### Tests de Casos Edge

- [ ] **Paso 9.4: Backend - Tests de validación**
  - [ ] Tests para DTOs con datos inválidos
  - [ ] Tests para operaciones con IDs inexistentes
  - [ ] Tests para operaciones sin autenticación
  - [ ] Tests para operaciones sin permisos

- [ ] **Paso 9.5: Frontend - Tests de estados de error**
  - [ ] Tests para componentes en estado de carga
  - [ ] Tests para componentes con error de API
  - [ ] Tests para componentes sin datos
  - [ ] Tests para componentes con datos inválidos

- [ ] **Paso 9.6: ML Service - Tests de robustez**
  - [ ] Tests con datos de entrada malformados
  - [ ] Tests con modelos no cargados
  - [ ] Tests con predicciones extremas
  - [ ] Tests de timeout

#### Verificación Final de Cobertura

- [ ] **Paso 9.7: Medición final de cobertura**
  - [ ] Backend: Verificar ≥ 70%
  - [ ] Frontend: Verificar ≥ 70%
  - [ ] ML Service: Verificar ≥ 70%
  - [ ] Documentar métricas finales

---

### FASE 10: Integración con CI/CD y Documentación (Prioridad: MEDIA)

**Objetivo**: Automatizar ejecución de tests y mantener calidad

#### Configuración de GitHub Actions

- [ ] **Paso 10.1: Crear workflow de CI para Backend**
  - [ ] Crear `.github/workflows/backend-tests.yml`
  - [ ] Configurar para ejecutar en cada push y PR
  - [ ] Incluir steps:
    - Checkout código
    - Setup Java 17
    - Run tests con Maven
    - Upload reporte de cobertura
    - Fail si cobertura < 70%

- [ ] **Paso 10.2: Crear workflow de CI para Frontend**
  - [ ] Crear `.github/workflows/frontend-tests.yml`
  - [ ] Configurar para ejecutar en cada push y PR
  - [ ] Incluir steps:
    - Checkout código
    - Setup Node.js
    - Install dependencies
    - Run tests con Vitest
    - Upload reporte de cobertura
    - Fail si cobertura < 70%

- [ ] **Paso 10.3: Crear workflow de CI para ML Service**
  - [ ] Crear `.github/workflows/ml-tests.yml`
  - [ ] Configurar para ejecutar en cada push y PR
  - [ ] Incluir steps:
    - Checkout código
    - Setup Python 3.11
    - Install dependencies
    - Run tests con pytest
    - Upload reporte de cobertura
    - Fail si cobertura < 70%

#### Documentación de Testing

- [ ] **Paso 10.4: Crear guía de testing**
  - [ ] Crear `docs/testing/GUIA_TESTING.md`
  - [ ] Documentar:
    - Cómo ejecutar tests localmente
    - Cómo escribir nuevos tests
    - Estándares y convenciones
    - Troubleshooting común

- [ ] **Paso 10.5: Actualizar README principal**
  - [ ] Añadir sección de testing
  - [ ] Incluir badges de cobertura
  - [ ] Documentar comandos de testing

- [ ] **Paso 10.6: Crear matriz de trazabilidad**
  - [ ] Crear `docs/testing/MATRIZ_TRAZABILIDAD.md`
  - [ ] Mapear requerimientos → tests
  - [ ] Documentar qué tests cubren qué funcionalidades

#### Configuración de Pre-commit Hooks

- [ ] **Paso 10.7: Instalar Husky (opcional)**
  - [ ] Instalar Husky en frontend
  - [ ] Configurar pre-commit hook para ejecutar tests
  - [ ] Configurar pre-push hook para verificar cobertura

---

### FASE 11: Validación y Entrega (Prioridad: CRÍTICA)

**Objetivo**: Verificación completa del cumplimiento del objetivo 70%

#### Validación Integral

- [ ] **Paso 11.1: Ejecutar suite completa de tests**
  - [ ] Backend: `./mvnw clean verify`
  - [ ] Frontend: `npm run test:run && npm run test:coverage`
  - [ ] ML Service: `pytest --cov=app --cov-report=term`
  - [ ] Verificar que no haya tests fallando

- [ ] **Paso 11.2: Generar reportes finales**
  - [ ] Consolidar reportes de cobertura
  - [ ] Crear dashboard de métricas
  - [ ] Documentar resultados

- [ ] **Paso 11.3: Verificación de cumplimiento RNF007**
  - [ ] Confirmar Backend ≥ 70%
  - [ ] Confirmar Frontend ≥ 70%
  - [ ] Confirmar ML Service ≥ 70%
  - [ ] Actualizar documentación de requerimientos

#### Presentación de Resultados

- [ ] **Paso 11.4: Crear reporte ejecutivo**
  - [ ] Crear `docs/testing/REPORTE_COBERTURA_FINAL.md`
  - [ ] Incluir:
    - Métricas iniciales vs finales
    - Gráficas de progreso
    - Resumen de tests implementados
    - Lecciones aprendidas
    - Recomendaciones futuras

- [ ] **Paso 11.5: Demo de tests en ejecución**
  - [ ] Preparar demostración de:
    - Tests unitarios
    - Tests de integración
    - Tests E2E
    - Reportes de cobertura

---

## 📊 MÉTRICAS Y OBJETIVOS

### Distribución de Tests por Fase

| Fase | Backend | Frontend | ML Service | Total Estimado |
|------|---------|----------|------------|----------------|
| Fase 1 | 0 tests | 0 tests | 0 tests | Infraestructura |
| Fase 2 | ~30 tests | 0 tests | 0 tests | 30 tests |
| Fase 3 | ~25 tests | 0 tests | 0 tests | 25 tests |
| Fase 4 | ~15 tests | 0 tests | 0 tests | 15 tests |
| Fase 5 | 0 tests | ~40 tests | 0 tests | 40 tests |
| Fase 6 | 0 tests | ~30 tests | 0 tests | 30 tests |
| Fase 7 | 0 tests | 0 tests | ~25 tests | 25 tests |
| Fase 8 | 0 tests | 4 E2E | 0 tests | 4 tests |
| Fase 9 | ~20 tests | ~20 tests | ~15 tests | 55 tests |
| **TOTAL** | **~90 tests** | **~94 tests** | **~40 tests** | **~224 tests** |

### Objetivos de Cobertura por Fase

| Fase | Backend Target | Frontend Target | ML Service Target |
|------|----------------|-----------------|-------------------|
| Fase 2 | 40% | 0% | 0% |
| Fase 3 | 55% | 0% | 0% |
| Fase 4 | 65% | 0% | 0% |
| Fase 5 | 65% | 40% | 0% |
| Fase 6 | 65% | 60% | 0% |
| Fase 7 | 65% | 60% | 50% |
| Fase 9 | **≥70%** | **≥70%** | **≥70%** |

---

## 🎯 CRITERIOS DE ÉXITO

### ✅ Infraestructura Configurada:
- [ ] Maven tests habilitados y ejecutándose
- [ ] JaCoCo generando reportes de cobertura
- [ ] Vitest configurado y funcional
- [ ] pytest configurado y funcional
- [ ] Scripts de testing documentados

### ✅ Cobertura de 70% Alcanzada:
- [ ] Backend: ≥ 70% líneas, branches, métodos
- [ ] Frontend: ≥ 70% statements, branches, functions, lines
- [ ] ML Service: ≥ 70% lines, branches

### ✅ Calidad de Tests:
- [ ] Tests unitarios aislados con mocks apropiados
- [ ] Tests de integración usando base de datos de test
- [ ] Tests E2E cubriendo flujos críticos
- [ ] Sin tests flaky (intermitentes)
- [ ] Tiempo de ejecución razonable (< 5 min por suite)

### ✅ Automatización:
- [ ] CI/CD ejecutando tests automáticamente
- [ ] Reportes de cobertura generados en cada build
- [ ] Builds fallando si cobertura < 70%

### ✅ Documentación:
- [ ] Guía de testing completa
- [ ] Matriz de trazabilidad actualizada
- [ ] README actualizado con comandos de testing
- [ ] Reporte final de cumplimiento RNF007

---

## 📝 ARCHIVOS A CREAR/MODIFICAR

### Backend:
- `backend/pom.xml` - Habilitar tests, añadir JaCoCo
- `backend/src/test/java/.../service/*ServiceTest.java` - Tests de servicios (5 archivos)
- `backend/src/test/java/.../controller/*ControllerTest.java` - Tests de controllers (4 archivos)
- `backend/src/test/java/.../repository/*RepositoryTest.java` - Tests de repositories (3 archivos)
- `backend/src/test/java/.../util/TestSecurityConfig.java` - Configuración de seguridad para tests

### Frontend:
- `frontend/vitest.config.ts` - Configuración de Vitest
- `frontend/src/test/setup.ts` - Setup de testing
- `frontend/package.json` - Scripts de testing
- `frontend/src/components/*.test.tsx` - Tests de componentes (10+ archivos)
- `frontend/src/services/*.test.ts` - Tests de servicios (5 archivos)
- `frontend/src/hooks/*.test.ts` - Tests de hooks (2 archivos)
- `frontend/src/contexts/*.test.tsx` - Tests de contextos (1 archivo)
- `frontend/cypress/e2e/*.cy.ts` - Tests E2E (4 archivos)
- `frontend/cypress.config.ts` - Configuración de Cypress

### ML Service:
- `ml-prediction-service/pytest.ini` - Configuración de pytest
- `ml-prediction-service/requirements.txt` - Añadir pytest
- `ml-prediction-service/tests/unit/*.py` - Tests unitarios (5+ archivos)
- `ml-prediction-service/tests/integration/*.py` - Tests de integración (2 archivos)

### Documentación:
- `docs/testing/GUIA_TESTING.md` - Guía completa de testing
- `docs/testing/MATRIZ_TRAZABILIDAD.md` - Matriz de requerimientos
- `docs/testing/REPORTE_COBERTURA_FINAL.md` - Reporte final
- `README.md` - Actualización con sección de testing

### CI/CD:
- `.github/workflows/backend-tests.yml` - Workflow de backend
- `.github/workflows/frontend-tests.yml` - Workflow de frontend
- `.github/workflows/ml-tests.yml` - Workflow de ML

---

## ⚠️ RIESGOS Y MITIGACIONES

### Riesgo 1: Tiempo de Implementación
**Descripción**: 224 tests estimados pueden tomar varias semanas  
**Mitigación**: 
- Priorizar fases 1-5 (críticas)
- Implementar en paralelo (backend y frontend simultáneamente)
- Usar generadores de tests cuando sea posible

### Riesgo 2: Tests Frágiles
**Descripción**: Tests pueden romperse frecuentemente con cambios en código  
**Mitigación**:
- Escribir tests mantenibles y desacoplados
- Usar patrones de Page Object para E2E
- Revisar y refactorizar tests regularmente

### Riesgo 3: Cobertura Superficial
**Descripción**: Alcanzar 70% sin tests de calidad  
**Mitigación**:
- Revisar código de tests en PRs
- Enfocarse en casos edge y manejo de errores
- No escribir tests solo para aumentar cobertura

### Riesgo 4: Performance de CI/CD
**Descripción**: Suite de tests muy lenta puede bloquear desarrollo  
**Mitigación**:
- Ejecutar tests unitarios en paralelo
- Separar tests E2E en workflow diferente
- Optimizar setup/teardown de tests

---

## 📅 CRONOGRAMA ESTIMADO

| Fase | Duración Estimada | Dependencias |
|------|-------------------|--------------|
| Fase 1 | 1-2 días | Ninguna |
| Fase 2 | 3-4 días | Fase 1 |
| Fase 3 | 3-4 días | Fase 1 |
| Fase 4 | 2-3 días | Fase 1 |
| Fase 5 | 4-5 días | Fase 1 |
| Fase 6 | 3-4 días | Fase 5 |
| Fase 7 | 3-4 días | Fase 1 |
| Fase 8 | 2-3 días | Fase 5 |
| Fase 9 | 3-5 días | Fases 2-8 |
| Fase 10 | 2-3 días | Fase 9 |
| Fase 11 | 1-2 días | Todas |
| **TOTAL** | **27-39 días** | (~5-8 semanas) |

**Nota**: Con 2-3 desarrolladores trabajando en paralelo, el tiempo puede reducirse a 3-4 semanas.

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

1. **Aprobar este plan**: Revisar y confirmar que el enfoque es correcto
2. **Iniciar Fase 1**: Configurar infraestructura de testing (crítico)
3. **Ejecutar en paralelo**:
   - Un desarrollador en Backend (Fases 2-4)
   - Un desarrollador en Frontend (Fases 5-6)
   - Un desarrollador en ML Service (Fase 7)
4. **Reuniones de sincronización**: Cada 2-3 días para reportar progreso

---

## 📌 ESTADO: 🔄 ESPERANDO APROBACIÓN (Tests)

### Notas de Implementación
- **Prioridad**: CRÍTICA - Cumplimiento de RNF007
- **Complejidad**: ALTA - Requiere implementación de 224+ tests
- **Tiempo Estimado**: 5-8 semanas con equipo completo
- **Riesgo**: MEDIO - Requiere disciplina y constancia
- **Impacto**: ALTO - Mejora significativa en calidad y mantenibilidad del código

---

## 📊 ANÁLISIS DE ABASTECIMIENTO CON XGBOOST (Tesis) - 28 Enero 2026

### Descripción del Proyecto

Crear un script completo de análisis de datos para la tesis de un sistema de abastecimiento para restaurante que utiliza XGBoost para predecir volúmenes de compra. El script debe demostrar el valor de los datos sintéticos mediante curvas de aprendizaje.

**OBJETIVO PRINCIPAL:**
Demostrar visualmente cómo el aumento del volumen de datos mejora la precisión del modelo XGBoost, comparando:
- Modelo entrenado con **5 días reales** de ventas
- Modelo entrenado con **6 meses de datos sintéticos** (generados con estacionalidad, ruido y tendencia)

### Componentes del Sistema

1. **Conexión a Base de Datos**: Acceder a PostgreSQL y extraer datos reales de ventas
2. **Análisis Descriptivo**: Calcular tendencias y promedios de ventas de los 5 días
3. **Generación de Datos Sintéticos**: Simular 6 meses de ventas con:
   - Estacionalidad semanal (domingos sin ventas)
   - Ruido aleatorio para variabilidad natural
   - Tendencia de crecimiento del 2% mensual
4. **Entrenamiento de Modelos XGBoost**: Entrenar dos modelos independientes
5. **Comparación de Métricas**: Calcular MAE y RMSE para ambos modelos
6. **Visualización**: Crear curvas de aprendizaje (Learning Curves) con Matplotlib

---

## 📋 PLAN DE IMPLEMENTACIÓN (Tesis)

### FASE 1: Configuración y Extracción de Datos Reales

- [x] **Paso 1.1: Crear directorio y estructura del proyecto**
  - [x] Crear carpeta `analisis-tesis-xgboost/` en la raíz del proyecto
  - [x] Crear subcarpetas:
    - `scripts/` - Para el script principal
    - `data/` - Para almacenar datasets generados
    - `results/` - Para gráficas y reportes
    - `models/` - Para guardar modelos entrenados

- [x] **Paso 1.2: Crear script de conexión a base de datos**
  - [x] Crear archivo `analisis-tesis-xgboost/scripts/analisis_abastecimiento_xgboost.py`
  - [x] Implementar función `conectar_base_datos()`:
    - Leer credenciales desde variables de entorno (DB_URL, DB_USER, DB_PASS)
    - Usar `psycopg2` o `sqlalchemy` para conexión a PostgreSQL
    - Implementar manejo de errores de conexión
  - [x] Añadir logging para debug

- [x] **Paso 1.3: Explorar base de datos para encontrar fechas con muchos registros**
  - [x] Implementar función `explorar_fechas_con_datos(conn)`:
    - Consultar tabla `ordenes_de_ventas`
    - Agrupar por fecha (usando `fecha_orden`)
    - Ordenar por cantidad de registros descendente
    - Retornar top 10 fechas con más ventas
  - [x] Mostrar resultado al usuario para selección

- [x] **Paso 1.4: Extraer datos de ventas de 5 días consecutivos**
  - [x] Implementar función `extraer_ventas_5_dias(conn, fecha_inicio)`:
    - Calcular `fecha_fin = fecha_inicio + 5 días`
    - Query SQL:
      ```sql
      SELECT 
          DATE(fecha_orden) as fecha,
          COUNT(*) as num_transacciones,
          SUM(total_venta) as total_ventas,
          AVG(total_venta) as promedio_venta
      FROM ordenes_de_ventas
      WHERE fecha_orden BETWEEN fecha_inicio AND fecha_fin
      GROUP BY DATE(fecha_orden)
      ORDER BY fecha
      ```
    - Retornar DataFrame de pandas con los datos
  - [x] Guardar dataset en `data/ventas_5_dias_reales.csv`

- [x] **Paso 1.5: Análisis descriptivo de los 5 días**
  - [x] Implementar función `analizar_tendencia_5_dias(df)`:
    - Calcular promedio de ventas diarias
    - Calcular desviación estándar
    - Calcular tasa de crecimiento diario
    - Identificar día con mayor/menor ventas
    - Detectar tendencia (creciente/decreciente/estable) usando regresión lineal
  - [ ] Imprimir reporte de análisis en consola
  - [ ] Guardar reporte en `results/analisis_descriptivo_5_dias.txt`

---

## 📄 DOCUMENTACIÓN PARA GITHUB (README) - 03 Marzo 2026

### Descripción del Objetivo

Generar un README.md profesional y de alto impacto para el perfil de GitHub, destacando las habilidades de Full-Stack Developer y Data Scientist. El documento debe resaltar el uso de XGBoost para la predicción de inventario en un entorno real de Punto de Venta (POS).

**ESTADO ACTUAL:**
- Documento de tesis generado en `documents/TESIS_ML/DOCUMENTACION_TESIS.md`.
- El proyecto cuenta con una arquitectura robusta (Java/Spring Boot, React/TS, Python/ML).
- Se ha identificado la estructura de carpetas ideal para el repositorio.

### Plan de Acción

- [x] **Paso 1: Definir estructura de carpetas para el repo**
  - [x] Identificar carpetas core: `backend`, `frontend`, `ml-prediction-service`.
  - [x] Identificar assets: `analisis-tesis-xgboost/results`.
  - [x] Identificar documentación: `documents/TESIS_ML`.

- [x] **Paso 2: Generar README.md Principal**
  - [x] Crear el archivo `README.md` en la raíz del proyecto.
  - [x] Incluir Badges técnicos.
  - [x] Redactar sección de Resumen (Logística Inteligente).
  - [x] Detallar Stack Tecnológico y Arquitectura.
  - [x] Explicar Engine de ML (XGBoost, 25 variables, métricas).
  - [x] Añadir guía de ejecución rápida (Docker).
  - [x] Incluir sección "Sobre mí" y contacto.

---

## 📌 ESTADO: ✅ COMPLETADO (Documentación)


---

### FASE 2: Generación de Datos Sintéticos (6 meses) ✅

- [x] **Paso 2.1: Implementar función de generación de datos sintéticos**
  - [x] Crear función `generar_datos_sinteticos_6_meses(df_base, fecha_inicio)`:
    - **Parámetros de entrada:**
      - `df_base`: DataFrame con estadísticas de los 5 días reales
      - `fecha_inicio`: Fecha donde comienza la simulación
    - **Calcular estadísticas base:**
      - `venta_promedio_diaria = df_base['total_ventas'].mean()`
      - `num_transacciones_promedio = df_base['num_transacciones'].mean()`
      - `std_ventas = df_base['total_ventas'].std()`

- [x] **Paso 2.2: Generar secuencia de fechas (6 meses = 180 días)**
  - [x] Crear rango de fechas desde `fecha_inicio` hasta `fecha_inicio + 180 días`
  - [x] Usar `pd.date_range()` para generar todas las fechas

- [x] **Paso 2.3: Implementar estacionalidad semanal**
  - [x] Para cada fecha en el rango:
    - Si `fecha.weekday() == 6` (domingo): `ventas = 0` y `num_transacciones = 0`
    - Para otros días: aplicar factores de estacionalidad semanal
      - Lunes: 0.85x (inicio de semana, ventas menores)
      - Martes-Jueves: 1.0x (ventas normales)
      - Viernes: 1.15x (ventas mayores)
      - Sábado: 1.20x (ventas más altas de la semana)

- [x] **Paso 2.4: Implementar tendencia de crecimiento del 2% mensual**
  - [x] Calcular factor de crecimiento compuesto:
    - `mes_actual = (fecha - fecha_inicio).days // 30`
    - `factor_tendencia = (1.02) ** mes_actual`
  - [x] Aplicar factor a las ventas base

- [x] **Paso 2.5: Añadir ruido aleatorio**
  - [x] Para cada día (excepto domingos):
    - Generar ruido gaussiano: `np.random.normal(0, std_ventas * 0.15)`
    - Aplicar ruido a ventas: `ventas_dia = ventas_base * factor_tendencia * factor_estacionalidad + ruido`
    - Asegurar que ventas no sean negativas: `ventas_dia = max(0, ventas_dia)`
  - [x] Generar también ruido para `num_transacciones` de forma similar

- [x] **Paso 2.6: Añadir características adicionales para XGBoost**
  - [x] Para cada registro, calcular features:
    - `dia_semana` (0-6)
    - `dia_mes` (1-31)
    - `semana_año` (1-52)
    - `mes` (1-12)
    - `es_fin_de_semana` (0 o 1)
    - `es_domingo` (0 o 1)
    - `dias_desde_inicio` (contador incremental)
  - [x] Guardar DataFrame en `data/ventas_6_meses_sinteticas.csv`
  
- [x] **Paso 2.7: Implementar función de validación de datos sintéticos**
  - [x] Crear función `validar_datos_sinteticos(df_sintetico)`:
    - Validar que domingos tienen ventas = 0
    - Validar tendencia de crecimiento presente
    - Validar variabilidad (ruido) en los datos
    - Validar que todas las features están presentes
  - [x] Generar reporte de validación en consola

---

### FASE 3: Preparación de Datasets para Entrenamiento ✅

- [x] **Paso 3.1: Preparar dataset de 5 días reales**
  - [x] Implementar función `preparar_dataset_para_modelo(df)`:
    - Cargar `data/ventas_5_dias_reales.csv`
    - Añadir features temporales (día_semana, día_mes, etc.)
    - Separar features (X) y target (y):
      - X: `['dia_semana', 'dia_mes', 'mes', 'es_fin_de_semana', 'num_transacciones']`
      - y: `['total_ventas']`
  - [x] Guardar X_5dias e y_5dias

- [x] **Paso 3.2: Preparar dataset de 6 meses sintéticos**
  - [x] Cargar `data/ventas_6_meses_sinteticas.csv`
  - [x] Aplicar misma preparación que Paso 3.1
  - [x] Separar en train/test (80%-20%):
    - Usar `train_test_split` con `random_state=42`
    - `X_train_6m, X_test_6m, y_train_6m, y_test_6m`

- [x] **Paso 3.3: Normalización de features**
  - [x] Implementar `StandardScaler` de sklearn:
    - Ajustar en X_train_6m
    - Transformar X_train_6m, X_test_6m, y X_5dias
  - [x] Guardar scaler en `models/scaler.pkl`

---

### FASE 4: Entrenamiento de Modelos XGBoost ✅

- [x] **Paso 4.1: Configurar hiperparámetros de XGBoost**
  - [x] Definir diccionario de parámetros:
    ```python
    params = {
        'objective': 'reg:squarederror',
        'max_depth': 6,
        'learning_rate': 0.1,
        'n_estimators': 100,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'random_state': 42
    }
    ```

- [x] **Paso 4.2: Entrenar Modelo 1 - Con 5 días reales**
  - [x] Implementar función `entrenar_modelo_5_dias(X_5dias, y_5dias, params)`:
    - Crear modelo: `xgb.XGBRegressor(**params)`
    - Entrenar: `modelo.fit(X_5dias, y_5dias)`
    - Guardar modelo en `models/modelo_xgboost_5dias.pkl`
  - [x] Implementar validación cruzada con `cross_val_score` (cv=3)
  - [x] Calcular métricas en los propios datos de entrenamiento (sin test set por datos limitados):
    - MAE (Mean Absolute Error)
    - RMSE (Root Mean Squared Error)
  - [x] Imprimir y guardar métricas

- [x] **Paso 4.3: Entrenar Modelo 2 - Con 6 meses sintéticos**
  - [x] Implementar función `entrenar_modelo_6_meses(X_train_6m, y_train_6m, X_test_6m, y_test_6m, params)`:
    - Crear modelo: `xgb.XGBRegressor(**params)`
    - Entrenar: `modelo.fit(X_train_6m, y_train_6m)`
    - Predecir en test: `y_pred = modelo.predict(X_test_6m)`
    - Calcular métricas:
      - MAE entre `y_test_6m` y `y_pred`
      - RMSE entre `y_test_6m` y `y_pred`
    - Guardar modelo en `models/modelo_xgboost_6meses.pkl`
  - [x] Imprimir y guardar métricas

---

### FASE 5: Comparación de Métricas ✅

- [x] **Paso 5.1: Crear tabla comparativa de métricas**
  - [x] Implementar función `comparar_metricas(metricas_5dias, metricas_6meses)`:
    - Crear DataFrame con columnas: `['Modelo', 'MAE', 'RMSE', 'Num_Datos']`
    - Fila 1: Modelo 5 días
    - Fila 2: Modelo 6 meses
    - Calcular mejora porcentual:
      - `mejora_mae = ((mae_5dias - mae_6meses) / mae_5dias) * 100`
      - `mejora_rmse = ((rmse_5dias - rmse_6meses) / rmse_5dias) * 100`
  - [x] Imprimir tabla en consola con formato bonito (usando `tabulate`)
  - [x] Guardar tabla en `results/comparacion_metricas.txt`

- [x] **Paso 5.2: Análisis de resultados**
  - [x] Implementar función `analizar_resultados(metricas_5dias, metricas_6meses)`:
    - Determinar cuál modelo tiene mejor performance
    - Calcular factor de mejora
    - Generar texto de interpretación:
      - "El modelo entrenado con 6 meses de datos sintéticos mejora el MAE en X%"
      - "Esto demuestra que aumentar el volumen de datos mejora la capacidad predictiva"
  - [x] Guardar análisis en `results/interpretacion_resultados.txt`

---

### FASE 6: Curvas de Aprendizaje (Learning Curves) ✅

- [x] **Paso 6.1: Implementar función de curva de aprendizaje**
  - [x] Crear función `generar_learning_curve(X, y, params, nombre_modelo)`:
    - Definir tamaños de entrenamiento: `train_sizes = np.linspace(0.1, 1.0, 10)`
    - Usar `learning_curve` de sklearn:
      ```python
      from sklearn.model_selection import learning_curve
      train_sizes, train_scores, val_scores = learning_curve(
          estimator=xgb.XGBRegressor(**params),
          X=X,
          y=y,
          train_sizes=train_sizes,
          cv=5,
          scoring='neg_mean_absolute_error',
          n_jobs=-1
      )
      ```
    - Calcular media y desviación estándar de scores
    - Retornar datos para graficación

- [x] **Paso 6.2: Generar curva para modelo de 5 días**
  - [x] Llamar `generar_learning_curve(X_5dias, y_5dias, params, "5 días")`
  - [x] Guardar resultados en variables

- [x] **Paso 6.3: Generar curva para modelo de 6 meses**
  - [x] Llamar `generar_learning_curve(X_6m_completo, y_6m_completo, params, "6 meses")`
  - [x] Guardar resultados en variables

---

### FASE 7: Visualización con Matplotlib ✅

- [x] **Paso 7.1: Crear gráfica de curvas de aprendizaje**
  - [x] Implementar función `crear_grafica_learning_curves(datos_5dias, datos_6meses)`:
    - Crear figura con subplots: `fig, axes = plt.subplots(1, 2, figsize=(16, 6))`
    - **Subplot 1: Modelo 5 días**
      - Graficar train score vs tamaño de datos
      - Graficar validation score vs tamaño de datos
      - Añadir área sombreada para desviación estándar
      - Labels: "Número de muestras de entrenamiento" (x), "MAE" (y)
      - Título: "Curva de Aprendizaje - Modelo con 5 Días Reales"
      - Leyenda
    - **Subplot 2: Modelo 6 meses**
      - Igual que Subplot 1, con datos de 6 meses
      - Título: "Curva de Aprendizaje - Modelo con 6 Meses Sintéticos"

- [x] **Paso 7.2: Añadir anotaciones y estilo**
  - [x] Configurar estilo: `plt.style.use('seaborn-v0_8-darkgrid')`
  - [x] Añadir grid para facilitar lectura
  - [x] Añadir anotación de texto con mejora porcentual
  - [x] Usar colores distintivos:
    - Train score: azul
    - Validation score: rojo

- [x] **Paso 7.3: Crear gráfica comparativa de errores**
  - [x] Implementar función `crear_grafica_comparacion_errores(metricas_5dias, metricas_6meses)`:
    - Crear gráfico de barras con MAE y RMSE lado a lado
    - Dos grupos de barras: uno para 5 días, otro para 6 meses
    - Labels y título descriptivos
    - Añadir valores encima de cada barra

- [x] **Paso 7.4: Guardar todas las gráficas**
  - [x] Guardar learning curves en `results/learning_curves_comparacion.png` (alta resolución, dpi=300)
  - [x] Guardar gráfica de errores en `results/comparacion_errores.png`
  - [x] Guardar también versiones en PDF para documentos profesionales

---

### FASE 8: Documentación y Reportes Finales

- [x] **Paso 8.1: Crear reporte ejecutivo en Markdown** (Actualizado: Se genera versión HTML de alta fidelidad para Tesis)
- [x] **Fase 2 (Tesis): Aumentación de Datos y Feature Engineering** [COMPLETADO]
- [ ] **Fase 3 (Tesis): Entrenamiento y Evaluación Comparativa** [PENDIENTE]
  - [ ] Crear archivo `results/REPORTE_ANALISIS_XGBOOST.md`
  - [ ] Estructura del reporte:
    - **1. Resumen Ejecutivo**
      - Objetivo del análisis
      - Metodología aplicada
      - Resultados principales
    - **2. Datos Utilizados**
      - Descripción de datos reales (5 días)
      - Estadísticas descriptivas
      - Descripción de datos sintéticos (6 meses)
      - Justificación de parámetros de generación
    - **3. Metodología**
      - Preprocesamiento de datos
      - Features engineering
      - Configuración de XGBoost
      - Validación cruzada
    - **4. Resultados**
      - Tabla de métricas comparativas
      - Interpretación de curvas de aprendizaje
      - Análisis de mejora del modelo
    - **5. Conclusiones**
      - Importancia del volumen de datos
      - Validez de datos sintéticos
      - Recomendaciones para el sistema de abastecimiento
    - **6. Referencias**
      - Papers de XGBoost
      - Técnicas de generación de datos sintéticos

- [ ] **Paso 8.2: Crear notebook Jupyter interactivo**
  - [ ] Crear `analisis-tesis-xgboost/notebooks/Analisis_Interactivo_XGBoost.ipynb`
  - [ ] Convertir script principal a celdas de notebook
  - [ ] Añadir celdas de markdown con explicaciones detalladas
  - [ ] Incluir visualizaciones inline

- [ ] **Paso 8.3: Crear presentación de resultados**
  - [ ] Crear archivo `results/PRESENTACION_RESULTADOS.md` con slides en Markdown
  - [ ] Incluir:
    - Slide 1: Título y objetivo
    - Slide 2: Problema y solución
    - Slide 3: Datos reales vs sintéticos
    - Slide 4: Arquitectura del modelo
    - Slide 5: Curvas de aprendizaje
    - Slide 6: Comparación de métricas
    - Slide 7: Conclusiones
    - Slide 8: Trabajo futuro

---

### FASE 9: Empaquetado y Requisitos

- [ ] **Paso 9.1: Crear archivo requirements.txt**
  - [ ] Crear `analisis-tesis-xgboost/requirements.txt` con dependencias:
    ```
    numpy==1.24.3
    pandas==2.0.3
    scikit-learn==1.3.0
    xgboost==2.0.0
    matplotlib==3.7.2
    seaborn==0.12.2
    psycopg2-binary==2.9.7
    sqlalchemy==2.0.20
    python-dotenv==1.0.0
    tabulate==0.9.0
    jupyter==1.0.0
    ```

- [ ] **Paso 9.2: Crear README del proyecto**
  - [ ] Crear `analisis-tesis-xgboost/README.md`
  - [ ] Incluir:
    - Descripción del proyecto
    - Requisitos previos
    - Instrucciones de instalación
    - Cómo ejecutar el script
    - Estructura de carpetas
    - Explicación de resultados generados
    - Troubleshooting

- [ ] **Paso 9.3: Crear script de instalación**
  - [ ] Crear `analisis-tesis-xgboost/setup.sh`:
    ```bash
    #!/bin/bash
    # Crear entorno virtual
    python3 -m venv venv
    source venv/bin/activate
    # Instalar dependencias
    pip install -r requirements.txt
    # Crear directorios necesarios
    mkdir -p data results models
    ```

- [ ] **Paso 9.4: Crear archivo .env.example**
  - [ ] Crear `analisis-tesis-xgboost/.env.example`:
    ```
    DB_URL=jdbc:postgresql://localhost:5432/pos_fin
    DB_USER=tu_usuario
    DB_PASS=tu_contraseña
    ```
  - [ ] Añadir instrucciones en README para configurar .env

---

### FASE 10: Testing y Validación

- [ ] **Paso 10.1: Ejecutar script completo con datos reales**
  - [ ] Ejecutar `python scripts/analisis_abastecimiento_xgboost.py`
  - [ ] Verificar que se conecta correctamente a la base de datos
  - [ ] Verificar que extrae datos de 5 días
  - [ ] Verificar que genera datos sintéticos correctamente

- [ ] **Paso 10.2: Validar generación de datos sintéticos**
  - [ ] Verificar visualmente el CSV generado:
    - Domingos deben tener ventas = 0
    - Debe haber tendencia creciente del 2% mensual
    - Debe haber variabilidad (ruido) en los datos
  - [ ] Calcular estadísticas del dataset sintético:
    - Verificar que la tasa de crecimiento promedio sea ~2% mensual
    - Verificar que la distribución sea realista

- [ ] **Paso 10.3: Validar entrenamiento de modelos**
  - [ ] Verificar que los modelos se guardan en `models/`
  - [ ] Cargar modelos y verificar que pueden hacer predicciones
  - [ ] Verificar que las métricas tienen valores razonables

- [ ] **Paso 10.4: Validar gráficas generadas**
  - [ ] Abrir `results/learning_curves_comparacion.png`
  - [ ] Verificar que las curvas muestran convergencia
  - [ ] Verificar que el modelo de 6 meses tiene menor error
  - [ ] Verificar calidad visual de las gráficas (legibilidad, colores, etiquetas)

- [ ] **Paso 10.5: Validar reporte final**
  - [ ] Leer `results/REPORTE_ANALISIS_XGBOOST.md`
  - [ ] Verificar que todas las secciones estén completas
  - [ ] Verificar que los números y métricas sean consistentes
  - [ ] Verificar gramática y ortografía

---

## 📊 MÉTRICAS DE ÉXITO

### ✅ Criterios de Aceptación:

1. **Extracción de Datos Reales:**
   - [ ] Se conecta exitosamente a la base de datos PostgreSQL
   - [ ] Se extraen datos de 5 días consecutivos con muchos registros
   - [ ] Se calculan correctamente tendencias y promedios

2. **Generación de Datos Sintéticos:**
   - [ ] Dataset de 6 meses (180 días) generado correctamente
   - [ ] Domingos tienen ventas = 0 (estacionalidad)
   - [ ] Crecimiento del 2% mensual observable
   - [ ] Ruido aleatorio añadido de forma realista

3. **Entrenamiento de Modelos:**
   - [ ] Modelo con 5 días entrena sin errores
   - [ ] Modelo con 6 meses entrena sin errores
   - [ ] Ambos modelos se guardan correctamente

4. **Comparación de Métricas:**
   - [ ] MAE y RMSE calculados para ambos modelos
   - [ ] Modelo de 6 meses muestra **menor error** que modelo de 5 días
   - [ ] Mejora porcentual documentada claramente

5. **Curvas de Aprendizaje:**
   - [ ] Gráficas muestran que error disminuye al aumentar datos
   - [ ] Modelo de 6 meses muestra mejor convergencia
   - [ ] Visualización clara y profesional

6. **Documentación:**
   - [ ] Reporte ejecutivo completo y legible
   - [ ] README con instrucciones claras
   - [ ] Código bien comentado en español

---

## 🎯 VALOR PARA LA TESIS

Este análisis demuestra empíricamente que:

1. **Más datos = Mejores predicciones**: La curva de aprendizaje muestra reducción de error al aumentar el volumen de datos
2. **Datos sintéticos son útiles**: Cuando hay escasez de datos reales, la generación sintética con parámetros realistas mejora el modelo
3. **XGBoost es efectivo**: El modelo aprende patrones complejos (estacionalidad, tendencia) de los datos
4. **Aplicación práctica**: El sistema de abastecimiento puede usar estas predicciones para optimizar compras

---

## 📁 ESTRUCTURA DE ARCHIVOS ESPERADA

```
analisis-tesis-xgboost/
├── README.md
├── requirements.txt
├── setup.sh
├── .env.example
├── scripts/
│   └── analisis_abastecimiento_xgboost.py
├── notebooks/
│   └── Analisis_Interactivo_XGBoost.ipynb
├── data/
│   ├── ventas_5_dias_reales.csv
│   └── ventas_6_meses_sinteticas.csv
├── models/
│   ├── modelo_xgboost_5dias.pkl
│   ├── modelo_xgboost_6meses.pkl
│   └── scaler.pkl
└── results/
    ├── analisis_descriptivo_5_dias.txt
    ├── comparacion_metricas.txt
    ├── interpretacion_resultados.txt
    ├── learning_curves_comparacion.png
    ├── learning_curves_comparacion.pdf
    ├── comparacion_errores.png
    ├── REPORTE_ANALISIS_XGBOOST.md
    └── PRESENTACION_RESULTADOS.md
```

---

## 🚀 COMANDOS PARA EJECUTAR

### Instalación:
```bash
cd analisis-tesis-xgboost
bash setup.sh
```

### Configuración:
```bash
cp .env.example .env
# Editar .env con credenciales reales
```

### Ejecución:
```bash
source venv/bin/activate
python scripts/analisis_abastecimiento_xgboost.py
```

### Ver resultados:
```bash
cat results/REPORTE_ANALISIS_XGBOOST.md
open results/learning_curves_comparacion.png
```

---

## 📌 ESTADO: 🔄 ESPERANDO APROBACIÓN

### Notas de Implementación
- **Prioridad**: ALTA - Proyecto de tesis
- **Complejidad**: MEDIA - Requiere conocimientos de ML y generación de datos sintéticos
- **Tiempo Estimado**: 2-3 días de implementación
- **Riesgo**: BAJO - Metodología bien definida
- **Impacto**: ALTO - Componente clave para demostrar valor del sistema en la tesis

### Dependencias:
- Base de datos PostgreSQL con datos de ventas reales
- Python 3.8+
- Librerías: XGBoost, pandas, numpy, scikit-learn, matplotlib

---

**Fecha de creación del plan**: 28 Enero 2026  
**Responsable**: Tesista - Sistema de Abastecimiento  
**Objetivo**: Demostrar mejora de XGBoost con aumento de volumen de datos mediante curvas de aprendizaje

---

## 📚 REPORTE TÉCNICO EXHAUSTIVO: Fase 1 - Consolidación de Tablas SQL (Tesis)

### Descripción de la Tarea
Generar la "Biblia" de los datos para el examen de tesis del 12 de marzo. Este reporte técnico detallará la arquitectura relacional, el proceso de consolidación de datos (JOINs), la integridad de los tipos de datos y la transformación hacia la Analytical Base Table (ABT) para XGBoost.

**OBJETIVO:** Documentar con rigor académico y técnico el estado de la Fase 1 del proyecto.

### Plan de Acción (Checklist)

- [ ] **1. Análisis de Arquitectura del Modelo Relacional**
  - [ ] Identificar entidades principales (Ventas, Productos, Inventarios, etc.)
  - [ ] Mapear relaciones (1:N, N:M) y cardinalidades
  - [ ] Crear Diagrama Entidad-Relación (ERD) usando Mermaid.js
  - [ ] Justificar Normalización vs Desnormalización en el contexto transaccional

- [ ] **2. El Proceso de Consolidación (The Joins)**
  - [ ] Localizar y extraer la consulta SQL maestra de consolidación
  - [ ] Explicación línea por línea de la lógica de unión
  - [ ] Justificación técnica de JOINs (Inner vs Left) para el dataset de entrenamiento
  - [ ] Explicar la granularidad de los datos consolidados

- [ ] **3. Análisis de Tipos de Datos e Integridad**
  - [ ] Analizar tipos elegidos (BigDecimal/Numeric para finanzas, OffsetDateTime para auditoría)
  - [ ] Explicar la eficiencia en el procesamiento posterior (Query Optimization)
  - [ ] Documentar reglas de Integridad Referencial aplicadas

- [ ] **4. Tratamiento de Datos Nulos y Limpieza**
  - [ ] Identificar estrategias de limpieza en SQL (COALESCE, filtros de fechas)
  - [ ] Explicar el impacto de datos nulos en modelos de Gradient Boosting (XGBoost)
  - [ ] Justificar la robustez de la solución implementada

- [ ] **5. Transformación a Analytical Base Table (ABT)**
  - [ ] Definir el concepto de ABT en ingeniería de datos
  - [ ] Explicar cómo la consulta transforma datos transaccionales en estructura plana
  - [ ] Identificar el vector de características (Feature Vector) para el modelo

- [ ] **6. Generación del Reporte Final**
  - [ ] Redactar el contenido con rigor técnico y estructura pedagógica
  - [ ] Ubicar el archivo en `/Users/andresjimenez/Documents/Tesis_ML/Reporte_Fase1_Consolidacion.md`
  - [ ] Verificar consistencia con los requerimientos de la tesis

## 📚 REPORTE TÉCNICO EXHAUSTIVO: Fase 4 - Funcionamiento Profundo de XGBoost (Tesis)

### Descripción de la Tarea
Generar un reporte técnico detallado sobre el funcionamiento interno de XGBoost, cubriendo la gestión de memoria con NumPy, la teoría de conjuntos de árboles de decisión, y la optimización mediante descenso de gradiente.

**OBJETIVO:** Documentar con rigor académico y técnico el funcionamiento del algoritmo XGBoost para la tesis.

### Plan de Acción (Checklist)

- [x] **1. Ingesta de Datos y Gestión de Memoria (NumPy)**
  - [x] Explicar la estructura de memoria contigua en arreglos NumPy (float32)
  - [x] Detallar cómo XGBoost utiliza el formato DMatrix para optimizar el acceso a datos
  - [x] Justificar la eficiencia computacional de este enfoque

- [x] **2. Teoría de Ensamble de Árboles de Decisión**
  - [x] Explicar el modelo aditivo de Gradient Boosting ($F_t(x) = F_{t-1}(x) + \eta \cdot h_t(x)$)
  - [x] Definir la función objetivo (Loss + Regularization)
  - [x] Detallar la navegación en la función de error para minimizarla

- [x] **3. Optimización y Descenso de Gradiente**
  - [x] Explicar el uso de la expansión de Taylor de segundo orden
  - [x] Definir Gradientes ($g_i$) y Hessianos ($h_i$)
  - [x] Describir el proceso de cálculo de pesos en las hojas ($w_j^*$)

- [x] **4. Entrenamiento de Aprendices Débiles (Weak Learners)**
  - [x] Explicar cómo el siguiente árbol predice los residuos (errores) del anterior
  - [x] Detallar el proceso de ajuste de parámetros y regularización

- [x] **5. Generación del Reporte Final**
  - [x] Redactar el contenido en `/Users/andresjimenez/Documents/Tesis_ML/04_Algoritmo_XGBoost_Profundo.md`
  - [x] Verificar rigor matemático y consistencia con los reportes anteriores

---

## 📌 ESTADO: ✅ REPORTE TÉCNICO PROFUNDO COMPLETADO

