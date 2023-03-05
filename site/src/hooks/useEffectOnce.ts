import { useEffect, useRef, useState } from "react";

// Stolen from: https://dev.to/ag-grid/react-18-avoiding-use-effect-getting-called-twice-4i9e
// Thank you, Alan Richardson!

export const useEffectOnce = (effect: () => void | (() => void)) => {
    const destroyFunc       = useRef<void | (() => void)>();
    const effectCalled      = useRef(false);
    const renderAfterCalled = useRef(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [val, setVal]     = useState(0);
  
    if (effectCalled.current)
        renderAfterCalled.current = true;
  
    useEffect(() => {
        if (!effectCalled.current) {
            destroyFunc.current = effect();
            effectCalled.current = true;
        }
    
        setVal((val) => val + 1);
    
        return () => {
            if (!renderAfterCalled.current)
                return;

            if (destroyFunc.current)
                destroyFunc.current();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};