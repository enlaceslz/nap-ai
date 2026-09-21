-- ==============================================================================
-- NAP TELECOM - Trilha de Auditoria Imutável (Append-Only Enforcement Trigger)
-- Impede estritamente operações de UPDATE e DELETE na tabela logs_auditoria.
-- ==============================================================================

CREATE OR REPLACE FUNCTION prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Operação não permitida em logs_auditoria: Registros de auditoria são estritamente imutáveis (append-only) e protegidos por integridade criptográfica SHA-256.';
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

DROP TRIGGER IF EXISTS trg_prevent_audit_update ON "logs_auditoria";--> statement-breakpoint
CREATE TRIGGER trg_prevent_audit_update
    BEFORE UPDATE ON "logs_auditoria"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_tampering();--> statement-breakpoint

DROP TRIGGER IF EXISTS trg_prevent_audit_delete ON "logs_auditoria";--> statement-breakpoint
CREATE TRIGGER trg_prevent_audit_delete
    BEFORE DELETE ON "logs_auditoria"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_tampering();
