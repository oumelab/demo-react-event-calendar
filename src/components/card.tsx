import React from "react";

type CardProps = {
  children: React.ReactNode;
  hoverShadow?: boolean;
};

export default function Card(props: CardProps) {
  const hoverStyle = props.hoverShadow
    ? "hover:shadow-lg transition-shadow duration-300"
    : "";

  return (
    <div
      className={`rounded-xl border w-full p-6 space-y-8 bg-gradient-to-br from-slate-50 to-sky-100 border-sky-500 ${hoverStyle}`}
    >
      {props.children}
    </div>
  );
}
