import React from "react";

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export const Modal = ({isOpen, onClose, children}: ModalProps) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000, // Ensure it's on top
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: "white",
                    padding: "30px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                    position: "relative",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {" "}
                {/* Prevent closing when clicking inside */}
                {children}
                <button
                    onClick={onClose}
                    style={{position: "absolute", top: "10px", right: "10px"}}
                    aria-label="Close"
                >
                    <svg
                        viewBox="0 0 24 24"
                        style={{ width: "14px", height: "14px" }}
                        aria-hidden>
                        <path
                            d="M6 6l12 12M18 6L6 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );

}
