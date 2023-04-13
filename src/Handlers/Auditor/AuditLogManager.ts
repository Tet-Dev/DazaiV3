export class AuditLogManager {
    static instance: AuditLogManager;
    static getInstance(): AuditLogManager {
        if (!AuditLogManager.instance) AuditLogManager.instance = new AuditLogManager();
        return AuditLogManager.instance;
    }
    private constructor() {

    }
}