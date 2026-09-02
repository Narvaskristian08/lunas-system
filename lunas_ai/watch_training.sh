#!/bin/bash
# Watch training progress in real-time

echo "=== LUNAS AI Training Monitor ==="
echo "Watching training progress..."
echo "Press Ctrl+C to exit monitor (training continues)"
echo ""

while true; do
    clear
    echo "=== Training Status ($(date '+%H:%M:%S')) ==="
    echo ""
    
    # Check if process is running
    if [ -f train_pid.txt ]; then
        PID=$(cat train_pid.txt)
        if ps -p $PID > /dev/null 2>&1; then
            echo "✅ Training is RUNNING (PID: $PID)"
            ps -p $PID -o pid,command,%cpu,%mem,etime | tail -1
            echo ""
        else
            echo "❌ Training process stopped"
            echo ""
        fi
    fi
    
    # Show recent training output from runs directory
    LATEST_RUN=$(ls -t runs/train/*/results.csv 2>/dev/null | head -1)
    if [ -f "$LATEST_RUN" ]; then
        echo "=== Latest Training Metrics ==="
        tail -5 "$LATEST_RUN"
        echo ""
    fi
    
    # Show GPU memory and loss from console output
    echo "=== Recent Training Log ==="
    if [ -f training.log ]; then
        grep -E "Epoch.*GPU_mem|box_loss|Transferring|optimizer|Starting training" training.log | tail -10
    fi
    
    sleep 5
done
