const {
  PROGRESS_STAGES,
  buildWorkOrderScope,
  canAccessWorkOrder,
  canManageWorkOrder,
  canReviewFinalWorkOrder,
  getSlaProjection,
  isEligibleRepairPersonnel,
  validateProgressUpdate
} = require('./workOrderService');

const cityEngineer = { _id: '507f191e810c19729de860a1', role: 'city_engineer' };
const utilityProvider = { _id: '507f191e810c19729de860a3', role: 'utility_provider', utilityCompany: 'Dagupan Water District' };
const repairWorker = {
  _id: '507f191e810c19729de860a2',
  role: 'repair_personnel',
  isActive: true,
  availability: 'available',
  repairOrganization: 'Dagupan Water District',
  barangay: 'Poblacion Oeste'
};
const workOrder = {
  assignedTo: repairWorker._id,
  assignmentState: 'accepted',
  responsibleOrganization: 'Dagupan Water District',
  jurisdiction: { barangay: 'Poblacion Oeste' }
};

describe('work-order domain rules', () => {
  test('uses one central repair-progress stage mapping', () => {
    expect(PROGRESS_STAGES).toEqual({
      0: 'assigned',
      25: 'site_preparation',
      50: 'main_repair',
      75: 'finishing',
      100: 'ready_for_completion'
    });
  });

  test('allows the defined forward sequence and rejects invalid progress/stage combinations', () => {
    expect(validateProgressUpdate({
      currentProgress: 25,
      nextProgress: 50,
      stage: 'main_repair',
      notes: 'Main repair work is underway.'
    })).toEqual(expect.objectContaining({ valid: true, progressPercent: 50 }));

    expect(validateProgressUpdate({
      currentProgress: 50,
      nextProgress: 25,
      stage: 'site_preparation',
      notes: 'Attempted regression'
    })).toEqual(expect.objectContaining({ valid: false }));
    expect(validateProgressUpdate({
      currentProgress: 50,
      nextProgress: 75,
      stage: 'ready_for_completion',
      notes: 'Mismatched stage'
    })).toEqual(expect.objectContaining({ valid: false }));
    expect(validateProgressUpdate({
      currentProgress: 75,
      nextProgress: 100,
      stage: 'ready_for_completion',
      notes: ''
    })).toEqual(expect.objectContaining({ valid: true, progressPercent: 100 }));
    expect(validateProgressUpdate({
      currentProgress: 25,
      nextProgress: 33,
      stage: 'main_repair',
      notes: 'Unsupported percentage'
    })).toEqual(expect.objectContaining({ valid: false }));
  });

  test('records field notes without changing progress and rejects empty or advancing notes', () => {
    const update = { currentProgress: 0, nextProgress: 0, stage: 'assigned', updateType: 'note', notes: 'Repair area secured.' };
    expect(validateProgressUpdate(update)).toEqual({ valid: true, progressPercent: 0, stage: 'assigned' });
    expect(validateProgressUpdate({ ...update, notes: ' ' }).valid).toBe(false);
    expect(validateProgressUpdate({ ...update, nextProgress: 25, stage: 'site_preparation' }).valid).toBe(false);
    expect(validateProgressUpdate({ ...update, updateType: 'completion', nextProgress: 25 }).valid).toBe(false);
    expect(validateProgressUpdate({ ...update, updateType: 'completion', nextProgress: 100, stage: 'ready_for_completion', notes: '' }).valid).toBe(true);
  });

  test('requires an active, available, organization-compatible repair worker', () => {
    expect(isEligibleRepairPersonnel(repairWorker, workOrder)).toBe(true);
    expect(isEligibleRepairPersonnel({
      ...repairWorker,
      availability: 'off_duty'
    }, workOrder)).toBe(false);
    expect(isEligibleRepairPersonnel({
      ...repairWorker,
      repairOrganization: 'Different Provider'
    }, workOrder)).toBe(false);
    expect(isEligibleRepairPersonnel({
      ...repairWorker,
      role: 'citizen'
    }, workOrder)).toBe(false);
  });

  test('keeps worker ownership and official jurisdiction scope server-side', () => {
    expect(canAccessWorkOrder(repairWorker, workOrder)).toBe(true);
    expect(canAccessWorkOrder({
      ...repairWorker,
      _id: '507f191e810c19729de8699'
    }, workOrder)).toBe(false);
    expect(canManageWorkOrder(cityEngineer, workOrder)).toBe(false);
    expect(canReviewFinalWorkOrder(cityEngineer, workOrder)).toBe(true);
    expect(canManageWorkOrder(utilityProvider, workOrder)).toBe(true);
    expect(canManageWorkOrder({
      _id: '507f191e810c19729de860b',
      role: 'barangay_official',
      barangay: 'Other Barangay'
    }, workOrder)).toBe(false);
    // This exact scope backs both GET /work-orders/my (used by the repair
    // mobile app) and repair-personnel detail reads.
    expect(buildWorkOrderScope(repairWorker)).toEqual({
      assignedTo: repairWorker._id,
      assignmentState: { $in: ['pending', 'accepted'] },
      responsibleOrganization: 'Dagupan Water District',
      'jurisdiction.barangay': 'Poblacion Oeste'
    });
  });

  test('derives approaching and overdue SLA state in the backend', () => {
    const previous = process.env.SLA_APPROACHING_THRESHOLD_HOURS;
    process.env.SLA_APPROACHING_THRESHOLD_HOURS = '24';
    const now = new Date('2026-08-19T00:00:00.000Z');
    expect(getSlaProjection({
      deadline: new Date('2026-08-19T12:00:00.000Z')
    }, now)).toEqual(expect.objectContaining({ state: 'approaching', isApproaching: true }));
    expect(getSlaProjection({
      deadline: new Date('2026-08-18T23:59:59.000Z')
    }, now)).toEqual(expect.objectContaining({ state: 'overdue', isOverdue: true }));
    if (previous === undefined) delete process.env.SLA_APPROACHING_THRESHOLD_HOURS;
    else process.env.SLA_APPROACHING_THRESHOLD_HOURS = previous;
  });
});
