// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

if (!admin.apps.length) {
    admin.initializeApp();
}

// Explicitly target the "eth-db" instance for our server-side Admin writes
const db = getFirestore("eth-db");

// ============================================================================
// --- 1. BUDGET AUTO-CALCULATION ENGINE ---
// ============================================================================
exports.autoCalculateBudget = functions.firestore
  .database("eth-db")
  .document("projects/{projectId}/invoices/{invoiceId}")
  .onWrite(async (change, context) => {
    const projectId = context.params.projectId;
    const projectRef = db.collection("projects").doc(projectId);

    try {
      const invoicesSnap = await projectRef.collection("invoices").where("status", "==", "Paid").get();
      
      let totalConsumed = 0;
      invoicesSnap.forEach(doc => {
        const invoiceData = doc.data();
        totalConsumed += (invoiceData.amount || 0);
      });

      return projectRef.update({ 
        budgetConsumed: totalConsumed,
        lastFinancialUpdate: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error(`Failed to calculate budget for project ${projectId}:`, error);
      return null;
    }
  });

// ============================================================================
// --- 2. NOTIFICATION COLLATION (PROJECTS) ---
// ============================================================================
exports.collateProjectNotifications = functions.firestore
  .database("eth-db")
  .document("projects/{projectId}")
  .onWrite(async (change, context) => {
    const projectId = context.params.projectId;
    const eventType = !change.before.exists ? "Created" : (!change.after.exists ? "Deleted" : "Updated");
    
    const afterData = change.after.exists ? change.after.data() : null;
    const beforeData = change.before.exists ? change.before.data() : null;
    const effectorUid = afterData?.leadArchitectId || beforeData?.leadArchitectId || 'System Controller';
    const projectName = afterData?.projectName || beforeData?.projectName || projectId;

    let effectorName = 'System Controller';
    if (effectorUid !== 'System Controller') {
        try {
            const userRec = await admin.auth().getUser(effectorUid);
            effectorName = userRec.displayName || userRec.email?.split('@')[0] || 'Authorized User';
        } catch(e) {
            console.warn("Auth lookup failed for UID:", effectorUid);
            effectorName = 'Authorized User';
        }
    }

    return db.collection("notifications").add({
      title: `Project ${eventType}`,
      message: `Workspace "${projectName}" was ${eventType.toLowerCase()}.`,
      targetId: projectId,
      targetType: 'project',
      effectorUid: effectorUid,
      effectorName: effectorName,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
  });

// ============================================================================
// --- 3. NOTIFICATION COLLATION (CLIENTS) ---
// ============================================================================
exports.collateClientNotifications = functions.firestore
  .database("eth-db")
  .document("clients/{clientId}")
  .onWrite(async (change, context) => {
    const clientId = context.params.clientId;
    const eventType = !change.before.exists ? "Created" : (!change.after.exists ? "Deleted" : "Updated");
    
    const afterData = change.after.exists ? change.after.data() : null;
    const beforeData = change.before.exists ? change.before.data() : null;
    const clientName = afterData?.companyName || beforeData?.companyName || clientId;

    return db.collection("notifications").add({
      title: `Client Profile ${eventType}`,
      message: `Client record for "${clientName}" was ${eventType.toLowerCase()}.`,
      targetId: clientId,
      targetType: 'client',
      effectorUid: 'System Controller',
      effectorName: 'System Controller',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
  });

// ============================================================================
// --- 4. BIDIRECTIONAL SYNC ENGINE (TASKS -> PHASES) ---
// ============================================================================
exports.syncTaskPhaseState = functions.firestore
  .database("eth-db")
  .document("projects/{projectId}/tasks/{taskId}")
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    const before = change.before.data();

    if (after.status === before.status) {
        return null;
    }

    const projectId = context.params.projectId;
    const taskPhaseName = after.phase;
    
    if (!taskPhaseName) {
        console.log(`Task ${context.params.taskId} lacks a bound phase. Skipping sync.`);
        return null;
    }

    try {
        const projectRef = db.collection('projects').doc(projectId);
        const projectSnap = await projectRef.get();

        if (!projectSnap.exists) {
            console.error(`Project ${projectId} missing during task-sync webhook.`);
            return null;
        }

        const projectData = projectSnap.data();
        let phases = projectData.phases || [];

        const phaseIndex = phases.findIndex(p => p.name === taskPhaseName);
        if (phaseIndex === -1) return null;

        const currentPhaseStatus = phases[phaseIndex].status;
        
        if (currentPhaseStatus === 'Approved' || currentPhaseStatus === 'Completed') {
            return null;
        }

        let targetPhaseStatus = currentPhaseStatus;

        if (after.status === 'In Progress' || after.status === 'Active') {
            targetPhaseStatus = 'In Progress';
        } else if (after.status === 'Under Review' || after.status === 'Pending Review') {
            targetPhaseStatus = 'Pending Review';
        }

        if (targetPhaseStatus !== currentPhaseStatus) {
            phases[phaseIndex].status = targetPhaseStatus;
            await projectRef.update({ phases: phases });
            console.log(`Phase [${taskPhaseName}] automatically synced to status [${targetPhaseStatus}].`);
        }

        return null;
    } catch (error) {
        console.error("Bidirectional sync failure:", error);
        throw new Error(error.message);
    }
  });