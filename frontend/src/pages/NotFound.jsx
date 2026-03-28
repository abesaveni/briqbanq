import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <h1 style={styles.errorCode}>404</h1>
                <div style={styles.divider}></div>
                <h2 style={styles.errorText}>Page Not Found</h2>
                <p style={styles.description}>
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>
                <Link to="/" style={styles.button}>
                    Go Back Home (Investor)
                </Link>
                <p style={styles.orText}>Or go to:</p>
                <div style={styles.portals}>
                    <Link to="/investor/dashboard" style={styles.link}>Investor</Link>
                    <Link to="/lender/dashboard" style={styles.link}>Lender</Link>
                    <Link to="/borrower/dashboard" style={styles.link}>Borrower</Link>
                    <Link to="/admin/dashboard" style={styles.link}>Admin</Link>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        fontFamily: "'Inter', sans-serif",
        textAlign: "center",
        padding: "20px",
    },
    content: {
        maxWidth: "500px",
    },
    errorCode: {
        fontSize: "120px",
        fontWeight: "900",
        margin: "0",
        background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        lineHeight: "1",
    },
    divider: {
        height: "4px",
        width: "60px",
        background: "linear-gradient(90deg, #6366f1, #a855f7)",
        margin: "20px auto",
        borderRadius: "2px",
    },
    errorText: {
        fontSize: "24px",
        color: "#1f2937",
        marginBottom: "16px",
    },
    description: {
        fontSize: "16px",
        color: "#6b7280",
        marginBottom: "32px",
        lineHeight: "1.6",
    },
    button: {
        display: "inline-block",
        padding: "12px 24px",
        backgroundColor: "#6366f1",
        color: "white",
        textDecoration: "none",
        borderRadius: "8px",
        fontWeight: "600",
        transition: "transform 0.2s, background-color 0.2s",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
    orText: { marginTop: "24px", marginBottom: "8px", fontSize: "14px", color: "#6b7280" },
    portals: { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" },
    link: { color: "#6366f1", textDecoration: "none", fontWeight: "500" },
};

export default NotFound;
