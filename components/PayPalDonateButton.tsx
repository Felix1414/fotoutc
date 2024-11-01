import { useEffect } from 'react';
import { PayPalButtons, usePayPalScriptReducer, SCRIPT_LOADING_STATE, DISPATCH_ACTION } from "@paypal/react-paypal-js";

export default function PayPalDonateButton() {
  const [{ options, isResolved }, dispatch] = usePayPalScriptReducer();

  useEffect(() => {
    dispatch({
      type: DISPATCH_ACTION.RESET_OPTIONS,
      value: {
        ...options,
        currency: "USD",
        intent: "capture",
      },
    });
  }, [dispatch, options]);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-green-500 text-white text-center">
        <h3 className="text-xl font-semibold">Apoya nuestro proyecto</h3>
        <p className="text-sm mt-1">Tu donación nos ayuda a mantener y mejorar FotoUTC</p>
      </div>
      <div className="p-4">
        {isResolved ? (
          <PayPalButtons
            style={{ layout: "vertical", shape: "rect" }}
            createOrder={(data, actions) => {
              return actions.order.create({
                intent: "CAPTURE",
                purchase_units: [
                  {
                    amount: {
                      currency_code: "USD",
                      value: "10.00",
                    },
                  },
                ],
              });
            }}
            onApprove={async (data, actions) => {
              if (actions.order) {
                const details = await actions.order.capture();
                const name = details.payer?.name?.given_name ?? 'Donante';
                alert(`Gracias ${name} por tu donación!`);
              }
            }}
          />
        ) : (
          <div className="text-center text-gray-500">Cargando botón de PayPal...</div>
        )}
      </div>
    </div>
  );
}