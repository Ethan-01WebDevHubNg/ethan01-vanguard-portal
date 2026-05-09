// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

admin.initializeApp();

// Explicitly target the "eth-db" instance for our server-side Admin writes
const db = getFirestore("eth-db");

// --- 1. BUDGET AUTO-CALCULATION ENGINE ---
exports.autoCalculateBudget = functions.firestore
  .database("eth-db") // Explicitly listen to the named database
  .document("projects/{projectId}/invoices/{invoiceId}")
  .onWrite(async (change, context) => {
    const projectId = context.params.projectId;
    const projectRef = db.collection("projects").doc(projectId);

    try {
      // Query all invoices within this specific project that are marked as 'Paid'
      const invoicesSnap = await projectRef.collection("invoices").where("status", "==", "Paid").get();
      
      let totalConsumed = 0;
      invoicesSnap.forEach(doc => {
        const invoiceData = doc.data();
        totalConsumed += (invoiceData.amount || 0);
      });

      // Atomically update the parent project's budgetConsumed metric
      return projectRef.update({ 
        budgetConsumed: totalConsumed,
        lastFinancialUpdate: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error(`Failed to calculate budget for project ${projectId}:`, error);
      return null;
    }
  });

// --- 2. NOTIFICATION COLLATION (PROJECTS) ---
exports.collateProjectNotifications = functions.firestore
  .database("eth-db")
  .document("projects/{projectId}")
  .onWrite(async (change, context) => {
    const projectId = context.params.projectId;
    
    // Determine mutation type
    const eventType = !change.before.exists ? "Created" : (!change.after.exists ? "Deleted" : "Updated");
    
    // Extract the UID of the effector if available
    const afterData = change.after.exists ? change.after.data() : null;
    const beforeData = change.before.exists ? change.before.data() : null;
    const effectorUid = afterData?.leadArchitectId || beforeData?.leadArchitectId || 'System Controller';
    const projectName = afterData?.projectName || beforeData?.projectName || projectId;

    return db.collection("notifications").add({
      title: `Project ${eventType}`,
      message: `Workspace "${projectName}" was ${eventType.toLowerCase()}.`,
      targetId: projectId,
      targetType: 'project',
      effectorUid: effectorUid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
  });

// --- 3. NOTIFICATION COLLATION (CLIENTS) ---
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
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
  });