"use client";

import { openContactModal } from "@/components/ContactModal";

/** Кнопка, открывающая модальное окно с формой заявки. */
export default function ContactButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={openContactModal} className={className}>
      {children}
    </button>
  );
}
