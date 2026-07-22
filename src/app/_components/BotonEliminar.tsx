"use client";

/**
 * Botón de eliminar con confirmación. Recibe una server action y el id.
 * Pide confirmación antes de enviar; funciona con progressive enhancement.
 */
export function BotonEliminar({
  accion,
  id,
  texto = "Eliminar",
  confirmacion,
}: {
  accion: (formData: FormData) => void | Promise<void>;
  id: string;
  texto?: string;
  confirmacion: string;
}) {
  return (
    <form
      action={accion}
      onSubmit={(e) => {
        if (!window.confirm(confirmacion)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-sm border border-[#C0563B] px-3 py-1.5 text-sm font-medium text-[#C0563B] hover:bg-[#FCEEEA]"
      >
        {texto}
      </button>
    </form>
  );
}
