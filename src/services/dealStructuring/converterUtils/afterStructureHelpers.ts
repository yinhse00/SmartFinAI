
// Main exports for after structure helpers - now organized into focused modules
export { 
    NORMALIZED_TARGET_SHAREHOLDER_NAME,
    isContinuingOrRemainingShareholder, 
    isTargetShareholderGroup 
} from './shareholderIdentificationUtils';

export { 
    createAcquirerEntity, 
    addAcquirerShareholders 
} from './acquirerEntityProcessor';

export { 
    addTargetWithOwnership 
} from './targetOwnershipProcessor';

export { 
    addConsiderationDetails 
} from './considerationProcessor';
