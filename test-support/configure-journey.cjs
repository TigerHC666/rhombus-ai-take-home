const fs = require('node:fs');
const path = require('node:path');
const { expect } = require('@playwright/test');
const { confirmSource } = require('./workflow.cjs');

// Cloud IAM grants and interactive account authentication are setup prerequisites.
// This journey uses only the already approved assessment source/destination.
async function configureJourney(page, directory) {
  await confirmSource(page);
  await page.getByRole('button', { name: 'Third Party Sources', exact: true }).click();
  const sourceDialog = page.getByRole('dialog', { name: 'Third Party Data', exact: true });
  await expect(sourceDialog.getByRole('heading', { name: 'rhombus-assessment-source-20261017-hc666/', exact: true })).toBeVisible();
  await sourceDialog.getByRole('button', { name: 'Browse files', exact: true }).click();
  await expect(sourceDialog.getByRole('row', { name: /^CSV orders\.csv / })).toBeVisible();
  await expect(sourceDialog).toContainText('Connected');
  fs.writeFileSync(path.join(directory, 'ui-source-connection.txt'), await sourceDialog.innerText());
  await page.screenshot({ path: path.join(directory, 'ui-source-connection.png') });
  await sourceDialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(sourceDialog).toHaveCount(0);
  await page.getByRole('complementary').getByText('orders.csv', { exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('complementary')).toContainText('Select Dataset');

  await page.getByRole('button', { name: /^Data Output / }).click();
  const panel = page.getByRole('complementary');
  await panel.getByRole('button', { name: 'Google Cloud Storage rhombus-assessment-output-20261017-hc6', exact: true }).click();
  await expect(panel.getByRole('combobox').filter({ visible: true }).first()).toContainText('CSV');
  await panel.getByPlaceholder('RhombusAI_output').fill('orders_cleaned');
  await panel.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(panel.getByPlaceholder('RhombusAI_output')).toHaveValue('orders_cleaned');
  fs.writeFileSync(path.join(directory, 'ui-gcs-destination.txt'), await panel.innerText());
  await page.screenshot({ path: path.join(directory, 'ui-gcs-destination.png') });

  await page.getByRole('tab', { name: 'Schedule', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Activate schedule', exact: true })).not.toBeChecked();
  await panel.getByRole('button').filter({ has: page.locator('svg.lucide-pencil') }).click();
  const scheduleDialog = page.getByRole('dialog', { name: 'Edit Schedule', exact: true });
  await scheduleDialog.getByRole('textbox', { name: 'Custom Cron Expression', exact: true }).fill('*/1 * * * *');
  await scheduleDialog.getByRole('button', { name: 'Update', exact: true }).click();
  await expect(scheduleDialog).toHaveCount(0);
  await expect(panel).toContainText('Custom: */1 * * * *');
  await expect(page.getByRole('switch', { name: 'Activate schedule', exact: true })).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Activate schedule', exact: true })).not.toBeChecked();
  fs.writeFileSync(path.join(directory, 'ui-schedule-configuration.txt'), await panel.innerText());
  await page.screenshot({ path: path.join(directory, 'ui-schedule-configuration.png') });
}
module.exports = { configureJourney };
