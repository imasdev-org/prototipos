/*
 * Reglas de negocio del selector de millas (Tienda Volar · Itaú).
 * Este archivo es la referencia de cálculo para desarrollo: el prototipo usa
 * exactamente estas funciones para todos los números que muestra.
 */
(function () {
  'use strict';

  // 1,92 millas por peso (medido en la ficha: $ 50 = 96 millas).
  var TASA = 1.92;
  // Saldo de millas del cliente. El prototipo permite bajarlo para ver el tope por saldo.
  var SALDO = 100000;
  function saldo() { return SALDO; }
  function fijarSaldo(n) { SALDO = n; }

  // Entrega: envío a domicilio (con costo) o retiro en sucursal (sin costo: «Gastos de Preparación $ 0», como en el sitio).
  var COSTO_ENTREGA = { domicilio: 150, retiro: 0 };
  var ROTULO_ENTREGA = { domicilio: 'Gastos de Envío', retiro: 'Gastos de Preparación' };
  // Con envío a domicilio, el Resumen avisa cuánto falta para el envío gratis (umbral de la captura del sitio).
  var ENVIO_GRATIS_DESDE = 3000;

  // Carrito del mock: leche $ 82 + cuchillo $ 90 (Personal Bank; cliente común $ 100) + sopera $ 2.360.
  // "final" = lo que se paga por los productos con los descuentos ya aplicados.
  // "descuento" = descuentos que el Resumen muestra en su propia fila.
  var CARRITO = {
    pb: { final: 2532, descuento: 10 },
    comun: { final: 2542, descuento: 0 }
  };

  // Ficha del aceite: sin selector. Muestra el precio en millas del producto, sobre el precio unitario que paga este cliente
  // («antes $ 417», precio $ 375): «Equivale a 720 millas». Con precio Personal Bank, N sale de ese precio (a confirmar con Itaú).
  // Las millas se eligen solo en el checkout.
  var FICHA = { precioAntes: 417, precio: 375 };
  FICHA.millas = Math.floor(FICHA.precio * TASA); // 720

  // Ficha del vino con promo 3x2 (lleva 3, paga 2). La franja «Aplica promo 3x2 • Ahorrás $ X» y el «Total con promo»
  // se arman con lo que ya calcula el carrito para la línea del producto: solo promos que se cumplen con unidades de ese
  // mismo producto (lleva N paga M, N por $ X, la N.ª al X %), y recién desde las unidades que pide la promo.
  var FICHA_PROMO = { precio: 744, lleva: 3, paga: 2, cantidadInicial: 3, cantidadMaxima: 12 };
  FICHA_PROMO.millas = Math.floor(FICHA_PROMO.precio * TASA); // 1.428

  function fichaPromo(cantidad) {
    var p = FICHA_PROMO, gratis = Math.floor(cantidad / p.lleva) * (p.lleva - p.paga);
    var total = (cantidad - gratis) * p.precio;
    return {
      aplica: gratis > 0,
      ahorro: gratis * p.precio, // precio de lista × unidades − total de la línea
      total: total,
      millasTotal: Math.floor(total * TASA)
    };
  }

  function maximoPedido(segmento) {
    // Nunca más de lo que se paga por los productos (con descuentos) ni más que el saldo.
    return Math.min(SALDO, Math.floor(CARRITO[segmento].final * TASA));
  }

  function valorInicialPedido(segmento) {
    // Sin selector en la ficha, el checkout arranca en la mitad del máximo del pedido (como hoy el slider de la ficha).
    return Math.floor(maximoPedido(segmento) / 2);
  }

  function acotar(valor, maximo) {
    if (!isFinite(valor)) return 0;
    return Math.max(0, Math.min(maximo, Math.round(valor)));
  }

  function ahorro(millas) {
    return Math.round(millas / TASA);
  }

  // Resumen del pedido con las millas elegidas (mismo cálculo que hoy):
  // SubTotal = productos antes de descuentos − valor en pesos de las millas, fila «Millas aplicadas» con la cantidad,
  // Total = SubTotal − Descuentos + entrega. Con todo cubierto: SubTotal $ 0 y sin fila de Descuentos.
  function resumen(segmento, tipoEntrega, millas) {
    return calcular(segmento, millas, COSTO_ENTREGA[tipoEntrega], ROTULO_ENTREGA[tipoEntrega]);
  }

  // Resumen del carrito: mismo cálculo, todavía sin costo de entrega.
  function resumenCarrito(segmento, millas) {
    return calcular(segmento, millas, 0, null);
  }

  function calcular(segmento, millas, costoEntrega, rotuloEntrega) {
    var c = CARRITO[segmento];
    // Valor en pesos de las millas: el mismo número que «Ahorrás $ X», nunca más que los productos con descuentos.
    var enPesos = Math.min(ahorro(millas), c.final);
    // Las millas cubren todo cuando su valor en pesos alcanza los productos con descuentos. Con el máximo del pedido
    // (si el saldo no lo limita) siempre pasa, aunque el máximo se redondee hacia abajo. A confirmar con Itaú.
    var todoCubierto = enPesos >= c.final;
    var subtotal = todoCubierto ? 0 : c.final + c.descuento - enPesos;
    var descuento = todoCubierto ? 0 : c.descuento;
    var entrega = costoEntrega;
    return {
      subtotal: subtotal,
      descuento: descuento,
      mostrarDescuento: descuento > 0,
      rotuloEntrega: rotuloEntrega,
      entrega: entrega,
      millas: millas,
      total: subtotal - descuento + entrega,
      todoCubierto: todoCubierto,
      // Cuánto falta para el envío gratis, medido sobre el SubTotal antes de las millas: así usar millas
      // no hace perder el envío gratis. A confirmar con Itaú.
      faltaEnvioGratis: ENVIO_GRATIS_DESDE - (c.final + c.descuento),
      // Se saltea Forma de pago solo si las millas cubren todo y la entrega no tiene costo.
      salteaPago: todoCubierto && entrega === 0
    };
  }

  function miles(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function pesos(n) {
    return (n < 0 ? '$ -' : '$ ') + miles(Math.abs(n));
  }

  window.Reglas = {
    TASA: TASA, ENVIO_GRATIS_DESDE: ENVIO_GRATIS_DESDE, saldo: saldo, fijarSaldo: fijarSaldo, FICHA: FICHA, CARRITO: CARRITO, PRECIO_CUCHILLO: { pb: 90, comun: 100 },
    FICHA_PROMO: FICHA_PROMO, fichaPromo: fichaPromo,
    maximoPedido: maximoPedido, valorInicialPedido: valorInicialPedido, acotar: acotar,
    ahorro: ahorro, resumen: resumen, resumenCarrito: resumenCarrito, miles: miles, pesos: pesos
  };
})();
