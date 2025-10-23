// src/components/shared/CheckoutStripe.jsx
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import stripeService from '../../services/StripeService';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutStripe = ({ 
  isOpen, 
  onClose, 
  reservaData, 
  onSuccess 
}) => {
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePagar = async () => {
    setProcessing(true);

    try {
      console.log('📦 reservaData recibido:', reservaData);
      
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe no se pudo cargar');
      }

      // Preparar datos para Stripe
      const payload = {
        amount: reservaData.monto,
        areaName: reservaData.areaNombre,
        areaId: reservaData.id_area,
        horarios: [reservaData.hora_inicio, reservaData.hora_fin],
        horarioLabels: [`${reservaData.hora_inicio} - ${reservaData.hora_fin}`],
        fecha: reservaData.fecha_reservacion,
        idPersona: reservaData.id_persona,
        successUrl: `${window.location.origin}/residente/reservas?payment=success`,
        cancelUrl: `${window.location.origin}/residente/reservas?payment=cancelled`
      };

      console.log('📤 Payload enviado a Stripe:', payload);

      // Crear sesión de checkout en el servidor
      const result = await stripeService.createCheckoutSession(payload);

      if (!result.success) {
        throw new Error(result.error || 'Error al crear la sesión de pago');
      }

      console.log('✅ Sesión creada:', result.data);

      // Redirigir a Stripe Checkout usando la URL directa
      if (result.data.url) {
        window.location.href = result.data.url;
      } else {
        throw new Error('No se recibió la URL de checkout de Stripe');
      }

    } catch (error) {
      console.error('Error en checkout:', error);
      toast.error(error.message || 'Error al procesar el pago');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💳</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Checkout Seguro
          </h2>
          <p className="text-gray-600">
            Procesado por Stripe
          </p>
        </div>

        {/* Resumen de pago */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Concepto:</span>
            <span className="font-medium text-gray-800">{reservaData.concepto}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Descripción:</span>
            <span className="font-medium text-gray-800">{reservaData.descripcion}</span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="font-semibold text-gray-800">Total:</span>
            <span className="font-bold text-2xl text-green-600">
              ${reservaData.monto?.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Información de seguridad */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">🔒</span>
            <div className="flex-1">
              <p className="text-xs text-blue-800 font-medium mb-1">
                Pago 100% seguro
              </p>
              <p className="text-xs text-blue-700">
                Tus datos están protegidos con encriptación SSL y son procesados por Stripe, 
                uno de los sistemas de pago más seguros del mundo.
              </p>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition duration-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handlePagar}
            disabled={processing}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Redirigiendo...</span>
              </>
            ) : (
              <>
                <span>Proceder al Pago</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>

        {/* Nota */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Serás redirigido a Stripe para completar el pago de forma segura
        </p>
      </div>
    </div>
  );
};

export default CheckoutStripe;
