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

  // Ficha del aceite: semi-simulador. En la ficha no se conocen los descuentos,
  // así que el máximo se calcula sobre el precio sin promoción.
  var FICHA = { precioSinPromo: 417, precioConPromo: 375, porDefecto: 400 };
  FICHA.maximo = Math.round(FICHA.precioSinPromo * TASA); // 801, como hoy en el sitio

  // Suma de lo elegido en las fichas de los productos del carrito (por ejemplo: leche 100 + cuchillo 100 + sopera 1.800).
  var SUMA_FICHAS = 2000;

  function maximoPedido(segmento) {
    // Nunca más de lo que se paga por los productos (con descuentos) ni más que el saldo.
    return Math.min(SALDO, Math.floor(CARRITO[segmento].final * TASA));
  }

  function valorInicialPedido(segmento) {
    // El checkout arranca con la suma de lo elegido en las fichas, con tope.
    return Math.min(SUMA_FICHAS, maximoPedido(segmento));
  }

  function acotar(valor, maximo) {
    if (!isFinite(valor)) return 0;
    return Math.max(0, Math.min(maximo, Math.round(valor)));
  }

  function ahorro(millas) {
    return Math.round(millas / TASA);
  }

  function precioFicha(millas) {
    return Math.max(0, Math.round(FICHA.precioSinPromo - millas / TASA));
  }

  // Ficha con dos promociones (el caso del mail de Rodrigo, sobre un producto real de Tienda Volar): Vino Tinto TRUMPETER
  // Malbec Syrah 750 ml, $ 744, con 35 % OFF por unidad y además un «3x2». La ficha muestra el precio con el 35 % OFF
  // ($ 483,60 → $ 484) y «Ahorrás $ 260»; el máximo de millas sale del precio con promoción (⌊483,60 × 1,92⌋ = 928).
  var PROMO = { precioSinPromo: 744, descuento: 35 };
  PROMO.precioConPromo = PROMO.precioSinPromo * (1 - PROMO.descuento / 100);
  PROMO.maximo = Math.floor(PROMO.precioConPromo * TASA);
  PROMO.porDefecto = Math.floor(PROMO.maximo / 2);
  PROMO.ahorro = Math.round(PROMO.precioSinPromo - PROMO.precioConPromo); // $ 260, lo que se ahorra por unidad
  function precioPromo(millas) {
    return Math.max(0, Math.round(PROMO.precioConPromo - millas / TASA));
  }

  // Resumen del pedido con las millas elegidas (mismo cálculo que hoy):
  // SubTotal en pesos ya descontadas las millas, fila "millas" con la cantidad,
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
    var cubierto = Math.min(millas / TASA, c.final);
    var resto = c.final - cubierto;
    var todoCubierto = resto < 0.5;
    var subtotal = todoCubierto ? 0 : Math.round(resto + c.descuento);
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
    TASA: TASA, ENVIO_GRATIS_DESDE: ENVIO_GRATIS_DESDE, saldo: saldo, fijarSaldo: fijarSaldo, FICHA: FICHA, SUMA_FICHAS: SUMA_FICHAS, CARRITO: CARRITO, PRECIO_CUCHILLO: { pb: 90, comun: 100 },
    maximoPedido: maximoPedido, valorInicialPedido: valorInicialPedido, acotar: acotar,
    ahorro: ahorro, precioFicha: precioFicha, PROMO: PROMO, precioPromo: precioPromo, resumen: resumen, resumenCarrito: resumenCarrito, miles: miles, pesos: pesos
  };
})();
