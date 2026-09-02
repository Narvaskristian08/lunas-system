#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║         LUNAS AI - Training Progress Monitor          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if training is running
if pgrep -f "python train.py" > /dev/null; then
    echo "✅ Training is RUNNING"
    echo ""
    
    # Show process info
    echo "📊 Process Info:"
    ps aux | grep "python train.py" | grep -v grep | awk '{print "   PID: " $2 " | CPU: " $3"% | Memory: " $4"%"}'
    echo ""
    
    # Show last 30 lines of log
    echo "📝 Recent Progress:"
    echo "────────────────────────────────────────────────────────"
    tail -30 training.log | grep -E "(Epoch|mAP|INFO|class)" || tail -30 training.log
    echo "────────────────────────────────────────────────────────"
    echo ""
    
    # Check if runs directory exists
    if [ -d "runs/train/rdd2022_yolov8s" ]; then
        echo "📂 Training Files:"
        ls -lh runs/train/rdd2022_yolov8s/weights/*.pt 2>/dev/null || echo "   No weights saved yet"
        echo ""
    fi
    
    echo "💡 Commands:"
    echo "   Watch live: tail -f training.log"
    echo "   Stop training: kill $(pgrep -f 'python train.py')"
    echo ""
else
    echo "❌ Training is NOT running"
    echo ""
    echo "Check log for completion or errors:"
    echo "   tail -50 training.log"
    echo ""
fi
