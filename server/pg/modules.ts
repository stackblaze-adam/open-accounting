// Static imports so the Next bundler includes every Convex module.
import * as activeEntity from "../../convex/activeEntity";
import * as agent from "../../convex/agent";
import * as agentToolQueries from "../../convex/agentToolQueries";
import * as agentTools from "../../convex/agentTools";
import * as ai from "../../convex/ai";
import * as aiCatalog from "../../convex/aiCatalog";
import * as aiCategorizeRuntime from "../../convex/aiCategorizeRuntime";
import * as aiCfo from "../../convex/aiCfo";
import * as aiCfoAggregate from "../../convex/aiCfoAggregate";
import * as aiCfoAnomalies from "../../convex/aiCfoAnomalies";
import * as aiCfoVerify from "../../convex/aiCfoVerify";
import * as aiChatActions from "../../convex/aiChatActions";
import * as aiChatRuntime from "../../convex/aiChatRuntime";
import * as aiChatTools from "../../convex/aiChatTools";
import * as aiInsights from "../../convex/aiInsights";
import * as aiInsightsAuth from "../../convex/aiInsightsAuth";
import * as aiInsightsVerify from "../../convex/aiInsightsVerify";
import * as aiProvider from "../../convex/aiProvider";
import * as aiProviderRegistry from "../../convex/aiProviderRegistry";
import * as aiResolve from "../../convex/aiResolve";
import * as aiSdkRuntime from "../../convex/aiSdkRuntime";
import * as aiThreads from "../../convex/aiThreads";
import * as audit from "../../convex/audit";
import * as auth from "../../convex/auth";
import * as auth_config from "../../convex/auth.config";
import * as authAdmin from "../../convex/authAdmin";
import * as authz from "../../convex/authz";
import * as bedrockCategorizer from "../../convex/bedrockCategorizer";
import * as bills from "../../convex/bills";
import * as calibration from "../../convex/calibration";
import * as categories from "../../convex/categories";
import * as connections from "../../convex/connections";
import * as contacts from "../../convex/contacts";
import * as coreViews from "../../convex/coreViews";
import * as credentials from "../../convex/credentials";
import * as defaultBankAccount from "../../convex/defaultBankAccount";
import * as demo from "../../convex/demo";
import * as demoWorkspace from "../../convex/demoWorkspace";
import * as embeddings from "../../convex/embeddings";
import * as embeddingsStore from "../../convex/embeddingsStore";
import * as employees from "../../convex/employees";
import * as entities from "../../convex/entities";
import * as entityMetrics from "../../convex/entityMetrics";
import * as entityScope from "../../convex/entityScope";
import * as expensesViews from "../../convex/expensesViews";
import * as exportAccount from "../../convex/exportAccount";
import * as incomeViews from "../../convex/incomeViews";
import * as insightsFixtures from "../../convex/insightsFixtures";
import * as intercompany from "../../convex/intercompany";
import * as invoices from "../../convex/invoices";
import * as ledger from "../../convex/ledger";
import * as ledgerBalances from "../../convex/ledgerBalances";
import * as moduleViews from "../../convex/moduleViews";
import * as money from "../../convex/money";
import * as notifications from "../../convex/notifications";
import * as onboarding from "../../convex/onboarding";
import * as onboardingProposals from "../../convex/onboardingProposals";
import * as openingBalanceCutoff from "../../convex/openingBalanceCutoff";
import * as openingBalanceDiagnostics from "../../convex/openingBalanceDiagnostics";
import * as payroll from "../../convex/payroll";
import * as payrollEmail from "../../convex/payrollEmail";
import * as payrollMath from "../../convex/payrollMath";
import * as payrollSettlement from "../../convex/payrollSettlement";
import * as performance from "../../convex/performance";
import * as pipeline from "../../convex/pipeline";
import * as plaid from "../../convex/plaid";
import * as plaidWebhook from "../../convex/plaidWebhook";
import * as plunk from "../../convex/plunk";
import * as portfolioMoney from "../../convex/portfolioMoney";
import * as portfolioViews from "../../convex/portfolioViews";
import * as profile from "../../convex/profile";
import * as proposals from "../../convex/proposals";
import * as publicDemo from "../../convex/publicDemo";
import * as readBudget from "../../convex/readBudget";
import * as realTestReset from "../../convex/realTestReset";
import * as receipts from "../../convex/receipts";
import * as reconciliation from "../../convex/reconciliation";
import * as reportViews from "../../convex/reportViews";
import * as reports from "../../convex/reports";
import * as requestAccess from "../../convex/requestAccess";
import * as ruleMatcher from "../../convex/ruleMatcher";
import * as rules from "../../convex/rules";
import * as secretBox from "../../convex/secretBox";
import * as secretRedaction from "../../convex/secretRedaction";
import * as seedDemo from "../../convex/seedDemo";
import * as session from "../../convex/session";
import * as settings from "../../convex/settings";
import * as streamRules from "../../convex/streamRules";
import * as streamTags from "../../convex/streamTags";
import * as streamViews from "../../convex/streamViews";
import * as streams from "../../convex/streams";
import * as stripe from "../../convex/stripe";
import * as stripeWebhook from "../../convex/stripeWebhook";
import * as syncAll from "../../convex/syncAll";
import * as systemActors from "../../convex/systemActors";
import * as team from "../../convex/team";
import * as testSupport from "../../convex/testSupport";
import * as transactionComments from "../../convex/transactionComments";
import * as unreviewedGap from "../../convex/unreviewedGap";
import * as weeklyDigest from "../../convex/weeklyDigest";
import * as weeklyDigestData from "../../convex/weeklyDigestData";
import * as workspaceReset from "../../convex/workspaceReset";
import * as workspaces from "../../convex/workspaces";

export const modules: Record<string, Record<string, unknown>> = {
  activeEntity: activeEntity as unknown as Record<string, unknown>,
  agent: agent as unknown as Record<string, unknown>,
  agentToolQueries: agentToolQueries as unknown as Record<string, unknown>,
  agentTools: agentTools as unknown as Record<string, unknown>,
  ai: ai as unknown as Record<string, unknown>,
  aiCatalog: aiCatalog as unknown as Record<string, unknown>,
  aiCategorizeRuntime: aiCategorizeRuntime as unknown as Record<string, unknown>,
  aiCfo: aiCfo as unknown as Record<string, unknown>,
  aiCfoAggregate: aiCfoAggregate as unknown as Record<string, unknown>,
  aiCfoAnomalies: aiCfoAnomalies as unknown as Record<string, unknown>,
  aiCfoVerify: aiCfoVerify as unknown as Record<string, unknown>,
  aiChatActions: aiChatActions as unknown as Record<string, unknown>,
  aiChatRuntime: aiChatRuntime as unknown as Record<string, unknown>,
  aiChatTools: aiChatTools as unknown as Record<string, unknown>,
  aiInsights: aiInsights as unknown as Record<string, unknown>,
  aiInsightsAuth: aiInsightsAuth as unknown as Record<string, unknown>,
  aiInsightsVerify: aiInsightsVerify as unknown as Record<string, unknown>,
  aiProvider: aiProvider as unknown as Record<string, unknown>,
  aiProviderRegistry: aiProviderRegistry as unknown as Record<string, unknown>,
  aiResolve: aiResolve as unknown as Record<string, unknown>,
  aiSdkRuntime: aiSdkRuntime as unknown as Record<string, unknown>,
  aiThreads: aiThreads as unknown as Record<string, unknown>,
  audit: audit as unknown as Record<string, unknown>,
  auth: auth as unknown as Record<string, unknown>,
  "auth.config": auth_config as unknown as Record<string, unknown>,
  authAdmin: authAdmin as unknown as Record<string, unknown>,
  authz: authz as unknown as Record<string, unknown>,
  bedrockCategorizer: bedrockCategorizer as unknown as Record<string, unknown>,
  bills: bills as unknown as Record<string, unknown>,
  calibration: calibration as unknown as Record<string, unknown>,
  categories: categories as unknown as Record<string, unknown>,
  connections: connections as unknown as Record<string, unknown>,
  contacts: contacts as unknown as Record<string, unknown>,
  coreViews: coreViews as unknown as Record<string, unknown>,
  credentials: credentials as unknown as Record<string, unknown>,
  defaultBankAccount: defaultBankAccount as unknown as Record<string, unknown>,
  demo: demo as unknown as Record<string, unknown>,
  demoWorkspace: demoWorkspace as unknown as Record<string, unknown>,
  embeddings: embeddings as unknown as Record<string, unknown>,
  embeddingsStore: embeddingsStore as unknown as Record<string, unknown>,
  employees: employees as unknown as Record<string, unknown>,
  entities: entities as unknown as Record<string, unknown>,
  entityMetrics: entityMetrics as unknown as Record<string, unknown>,
  entityScope: entityScope as unknown as Record<string, unknown>,
  expensesViews: expensesViews as unknown as Record<string, unknown>,
  exportAccount: exportAccount as unknown as Record<string, unknown>,
  incomeViews: incomeViews as unknown as Record<string, unknown>,
  insightsFixtures: insightsFixtures as unknown as Record<string, unknown>,
  intercompany: intercompany as unknown as Record<string, unknown>,
  invoices: invoices as unknown as Record<string, unknown>,
  ledger: ledger as unknown as Record<string, unknown>,
  ledgerBalances: ledgerBalances as unknown as Record<string, unknown>,
  moduleViews: moduleViews as unknown as Record<string, unknown>,
  money: money as unknown as Record<string, unknown>,
  notifications: notifications as unknown as Record<string, unknown>,
  onboarding: onboarding as unknown as Record<string, unknown>,
  onboardingProposals: onboardingProposals as unknown as Record<string, unknown>,
  openingBalanceCutoff: openingBalanceCutoff as unknown as Record<string, unknown>,
  openingBalanceDiagnostics: openingBalanceDiagnostics as unknown as Record<string, unknown>,
  payroll: payroll as unknown as Record<string, unknown>,
  payrollEmail: payrollEmail as unknown as Record<string, unknown>,
  payrollMath: payrollMath as unknown as Record<string, unknown>,
  payrollSettlement: payrollSettlement as unknown as Record<string, unknown>,
  performance: performance as unknown as Record<string, unknown>,
  pipeline: pipeline as unknown as Record<string, unknown>,
  plaid: plaid as unknown as Record<string, unknown>,
  plaidWebhook: plaidWebhook as unknown as Record<string, unknown>,
  plunk: plunk as unknown as Record<string, unknown>,
  portfolioMoney: portfolioMoney as unknown as Record<string, unknown>,
  portfolioViews: portfolioViews as unknown as Record<string, unknown>,
  profile: profile as unknown as Record<string, unknown>,
  proposals: proposals as unknown as Record<string, unknown>,
  publicDemo: publicDemo as unknown as Record<string, unknown>,
  readBudget: readBudget as unknown as Record<string, unknown>,
  realTestReset: realTestReset as unknown as Record<string, unknown>,
  receipts: receipts as unknown as Record<string, unknown>,
  reconciliation: reconciliation as unknown as Record<string, unknown>,
  reportViews: reportViews as unknown as Record<string, unknown>,
  reports: reports as unknown as Record<string, unknown>,
  requestAccess: requestAccess as unknown as Record<string, unknown>,
  ruleMatcher: ruleMatcher as unknown as Record<string, unknown>,
  rules: rules as unknown as Record<string, unknown>,
  secretBox: secretBox as unknown as Record<string, unknown>,
  secretRedaction: secretRedaction as unknown as Record<string, unknown>,
  seedDemo: seedDemo as unknown as Record<string, unknown>,
  session: session as unknown as Record<string, unknown>,
  settings: settings as unknown as Record<string, unknown>,
  streamRules: streamRules as unknown as Record<string, unknown>,
  streamTags: streamTags as unknown as Record<string, unknown>,
  streamViews: streamViews as unknown as Record<string, unknown>,
  streams: streams as unknown as Record<string, unknown>,
  stripe: stripe as unknown as Record<string, unknown>,
  stripeWebhook: stripeWebhook as unknown as Record<string, unknown>,
  syncAll: syncAll as unknown as Record<string, unknown>,
  systemActors: systemActors as unknown as Record<string, unknown>,
  team: team as unknown as Record<string, unknown>,
  testSupport: testSupport as unknown as Record<string, unknown>,
  transactionComments: transactionComments as unknown as Record<string, unknown>,
  unreviewedGap: unreviewedGap as unknown as Record<string, unknown>,
  weeklyDigest: weeklyDigest as unknown as Record<string, unknown>,
  weeklyDigestData: weeklyDigestData as unknown as Record<string, unknown>,
  workspaceReset: workspaceReset as unknown as Record<string, unknown>,
  workspaces: workspaces as unknown as Record<string, unknown>,
};
