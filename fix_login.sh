#!/bin/bash
sed -i 's/if (err.code === '\''auth\/operation-not-allowed'\'') {/if (err.code === '\''auth\/operation-not-allowed'\'' || err.code === '\''auth\/internal-error'\'' || err.code === '\''auth\/network-request-failed'\'') {/g' src/contexts/AuthContext.tsx
