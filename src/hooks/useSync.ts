/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { syncService } from '../lib/sync';

export function useSync() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    return syncService.subscribe(() => {
      setTick(t => t + 1);
    });
  }, []);

  return tick;
}
