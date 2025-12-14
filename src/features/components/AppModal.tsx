import { useEffect, useRef } from "react";

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const AppModal: React.FC<AppModalProps> = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // 1. Lógica para fechar ao pressionar ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // 2. Lógica para fechar ao clicar no backdrop (fundo escuro)
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Se o clique ocorreu no elemento pai (o backdrop) e não nos filhos
    if (event.target === modalRef.current) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  // O componente renderiza o backdrop e centraliza o conteúdo
  return (
    // Backdrop fixo que cobre a tela inteira (fixed inset-0)
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      {/* Container interno do Modal, onde o conteúdo (TransacaoForm) reside */}
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl transform transition-all scale-100 duration-300">
        {/* Renderiza o conteúdo (TransacaoForm) e o botão de fechar */}
        {/* Nota: O botão "Fechar" do seu código original (Dashboard.tsx) foi movido para cá */}
        {children}

        {/* Botão de Fechar na parte inferior (opcional, pode ser removido se o TransacaoForm tiver seu próprio botão) */}
        <button
          onClick={onClose}
          className="w-full text-center py-3 bg-gray-100 text-gray-600 font-medium rounded-b-xl hover:bg-gray-200 transition border-t"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default AppModal;
