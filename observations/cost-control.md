# Cost and resource control

Authorization ceiling: AUD 10 actual out-of-pocket spend, excluding the separately accepted temporary card authorization hold.

On October 17, 2026 at approximately 06:44–06:46 Australia/Sydney, the authenticated cloud consoles showed:

- AWS October estimated grand total: USD 0.00; no posted usage data. The console identified the account as a free-plan account whose costs are covered by credits.
- Google Cloud month-to-date total: $0.00. The account remained on free trial; its trial panel displayed approximately AU$427 credit and 90 days remaining, and stated charges would not begin without upgrading to paid billing.

These are displayed billing snapshots, not a claim that metering is instantaneous. Google explicitly warns that usage may take more than 24 hours to appear. Billing screenshots and payment information are retained outside the repository.

The assessment uses sub-kilobyte synthetic CSVs, one private S3 source object, and small GCS exports. No customer-funded compute instances or paid Rhombus subscription were created. Only one schedule (initially five minutes, later one minute) is enabled during supervised collection and is disabled immediately afterward. Cloud credentials are restricted to the assessment resources and must be revoked after evidence collection.

The assessment-provided voucher was redeemed on October 17 at approximately 07:12 Australia/Sydney. The displayed Rhombus balance became 5,023 credits. No paid plan was purchased. See [redemption confirmation](evidence/free-voucher-redeemed.png).

## Final account-access gate

The original account-management Chrome connection became unresponsive during final verification. The dedicated test browser remained operational. The user has been asked to restore the account-management connection for a fresh billing check and authorized temporary-key/integration revocation. Until that is completed, the earlier displayed zero totals remain historical snapshots; final spend and revocation are not verified. No paid subscription or additional compute resource was provisioned during the final tests.
