// ==========================================
// 1. CARGAR COMPONENTES REUTILIZABLES (HEADER Y FOOTER)
// ==========================================
function cargarComponente(idContenedor, rutaArchivo) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  fetch(rutaArchivo)
    .then((respuesta) => {
      if (!respuesta.ok) {
        throw new Error(`No se encontró ${rutaArchivo}`);
      }
      return respuesta.text();
    })
    .then((html) => {
      contenedor.innerHTML = html;
    })
    .catch((error) => {
      console.error("Error cargando componente:", error);
    });
}

// ==========================================
// 2. FUNCIONES AUXILIARES DE LOCALSTORAGE
// ==========================================
function obtenerCarrito() {
  try {
    const datos = localStorage.getItem("mewShopCarrito");
    return datos ? JSON.parse(datos) : [];
  } catch (error) {
    console.error("Error leyendo carrito de localStorage:", error);
    return [];
  }
}

function guardarCarrito(carrito) {
  localStorage.setItem("mewShopCarrito", JSON.stringify(carrito));
}

// ==========================================
// 3. GUARDAR PRODUCTOS AL HACER CLIC EN "¡LO QUIERO!"
// ==========================================
function inicializarBotonesProducto() {
  const botonesComprar = document.querySelectorAll(
    ".tarjeta-producto .btn, .tarjeta-producto button, .tarjeta-producto a"
  );

  if (botonesComprar.length === 0) return;

  botonesComprar.forEach((boton) => {
    // Ignora botones de envío de formulario, de la sección de pago o de confirmación
    if (
      boton.type === "submit" ||
      boton.closest("#seccion-formulario") ||
      boton.closest("#confirmacion-compra")
    ) {
      return;
    }

    boton.addEventListener("click", (evento) => {
      const tarjeta = boton.closest(".tarjeta-producto");
      if (!tarjeta) return;

      const elementoPrecio = tarjeta.querySelector(".precio-producto");
      if (!elementoPrecio) return;

      evento.preventDefault();

      const elementoTitulo = tarjeta.querySelector(".titulo-producto");
      const nombre = elementoTitulo ? elementoTitulo.textContent.trim() : "Producto Mew Shop";

      const precioLimpio = elementoPrecio.textContent.replace(/[^0-9.]/g, "");
      const precio = parseFloat(precioLimpio) || 0;

      const imagen = tarjeta.querySelector("img")?.src || "";

      const carrito = obtenerCarrito();
      const existente = carrito.find((item) => item.nombre === nombre);

      if (existente) {
        existente.cantidad += 1;
      } else {
        carrito.push({ nombre, precio, imagen, cantidad: 1 });
      }

      guardarCarrito(carrito);

      let mensaje = tarjeta.querySelector(".mensaje-agregado");
      if (!mensaje) {
        mensaje = document.createElement("p");
        mensaje.className = "mensaje-agregado";
        tarjeta.appendChild(mensaje);
      }

      mensaje.textContent = "¡Agregado al carrito! 🐾";

      clearTimeout(mensaje.temporizador);
      mensaje.temporizador = setTimeout(() => {
        mensaje.textContent = "";
      }, 2000);
    });
  });
}

// ==========================================
// 4. MOSTRAR Y GESTIONAR EL CARRITO (carrito.html)
// ==========================================
function mostrarCarrito() {
  const listaCarrito = document.getElementById("lista-carrito");
  const totalCarrito = document.getElementById("total-carrito");

  if (!listaCarrito || !totalCarrito) return;

  const carrito = obtenerCarrito();
  listaCarrito.innerHTML = "";

  if (carrito.length === 0) {
    listaCarrito.innerHTML = "<p>Aún no has agregado productos a tu carrito.</p>";
    totalCarrito.textContent = "Total: S/0.00";
    return;
  }

  let total = 0;

  carrito.forEach((producto, indice) => {
    const subtotal = producto.precio * producto.cantidad;
    total += subtotal;

    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-producto";
    tarjeta.innerHTML = `
      <div class="contenedor-foto-producto">
        <img src="${producto.imagen}" alt="${producto.nombre}">
      </div>
      <h2 class="titulo-producto">${producto.nombre}</h2>
      <p class="precio-producto">S/${producto.precio.toFixed(2)} x ${producto.cantidad}</p>
      <p>Subtotal: S/${subtotal.toFixed(2)}</p>
      <button type="button" class="btn btn-quitar" data-indice="${indice}">Quitar</button>
    `;

    listaCarrito.appendChild(tarjeta);
  });

  totalCarrito.textContent = `Total: S/${total.toFixed(2)}`;

  document.querySelectorAll(".btn-quitar").forEach((boton) => {
    boton.addEventListener("click", () => {
      const indice = Number(boton.dataset.indice);
      const carritoActual = obtenerCarrito();
      carritoActual.splice(indice, 1);
      guardarCarrito(carritoActual);
      mostrarCarrito();
    });
  });
}

function inicializarAccionesCarrito() {
  const btnVaciar = document.getElementById("btn-vaciar");
  const btnComprar = document.getElementById("btn-comprar");

  if (btnVaciar) {
    btnVaciar.addEventListener("click", () => {
      localStorage.removeItem("mewShopCarrito");
      mostrarCarrito();
    });
  }

  if (btnComprar) {
    btnComprar.addEventListener("click", () => {
      const carrito = obtenerCarrito();
      if (carrito.length === 0) {
        alert("Tu carrito está vacío. Agrega un producto primero.");
        return;
      }
      window.location.href = "pago.html";
    });
  }

  mostrarCarrito();
}

// ==========================================
// 5. LÓGICA DE LA PÁGINA DE PAGO (pago.html)
// ==========================================
function inicializarPaginaPago() {
  const formPago = document.getElementById("form-pago");
  if (!formPago) return;

  const resumenCantidad = document.getElementById("resumen-cantidad");
  const resumenTotal = document.getElementById("resumen-total");
  const seccionFormulario = document.getElementById("seccion-formulario");
  const confirmacionCompra = document.getElementById("confirmacion-compra");
  const detalleResumenCompra = document.getElementById("detalle-resumen-compra");

  const carrito = obtenerCarrito();

  if (carrito.length === 0) {
    window.location.href = "carrito.html";
    return;
  }

  let totalProductos = 0;
  let totalPagar = 0;

  carrito.forEach((item) => {
    totalProductos += item.cantidad;
    totalPagar += item.precio * item.cantidad;
  });

  if (resumenCantidad) {
    resumenCantidad.textContent = `Productos en tu pedido: ${totalProductos}`;
  }
  if (resumenTotal) {
    resumenTotal.textContent = `Total a pagar: S/${totalPagar.toFixed(2)}`;
  }

  formPago.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const carritoComprado = obtenerCarrito();
    const nombre = document.getElementById("nombre-cliente")?.value.trim() || "Cliente";
    const telefono = document.getElementById("telefono-cliente")?.value.trim() || "No especificado";
    const distrito = document.getElementById("distrito-cliente")?.value.trim() || "Lima";
    const direccion = document.getElementById("direccion-cliente")?.value.trim() || "Sin dirección";
    const metodo = document.getElementById("metodo-pago")?.value || "No seleccionado";

    let totalPagado = 0;
    let listaHTML = "<ul>";

    carritoComprado.forEach((item) => {
      const subtotal = item.precio * item.cantidad;
      totalPagado += subtotal;
      listaHTML += `<li>${item.nombre} (x${item.cantidad}) - S/${subtotal.toFixed(2)}</li>`;
    });

    listaHTML += "</ul>";

    // Vacía el carrito en localStorage
    localStorage.removeItem("mewShopCarrito");

    if (detalleResumenCompra) {
      detalleResumenCompra.innerHTML = `
        <p><strong>Cliente:</strong> ${nombre}</p>
        <p><strong>Teléfono:</strong> ${telefono}</p>
        <p><strong>Entrega en:</strong> ${direccion} (${distrito})</p>
        <p><strong>Método de pago:</strong> ${metodo}</p>
        <hr>
        <p><strong>Detalle de productos:</strong></p>
        ${listaHTML}
        <p class="precio-producto">Total pagado: S/${totalPagado.toFixed(2)}</p>
      `;
    }

    if (seccionFormulario) {
      seccionFormulario.style.display = "none";
    }
    if (confirmacionCompra) {
      confirmacionCompra.style.display = "block";
    }
  });
}

// ==========================================
// 6. ARRANQUE GENERAL CUANDO CARGA EL DOM
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  cargarComponente("header-container", "../layouts/headers.html");
  cargarComponente("footer-container", "../layouts/footer.html");

  inicializarBotonesProducto();
  inicializarAccionesCarrito();
  inicializarPaginaPago();
});