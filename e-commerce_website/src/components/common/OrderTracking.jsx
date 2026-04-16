import { CheckCircle, Clock, Truck, Package, MapPin } from 'lucide-react';

const STATUS_CONFIG = {
  placed: {
    label: 'Order Placed',
    icon: CheckCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
  },
  confirmed: {
    label: 'Order Confirmed',
    icon: Package,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500',
  },
  processing: {
    label: 'Processing',
    icon: Package,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500',
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-600',
  },
  delivered: {
    label: 'Delivered',
    icon: MapPin,
    color: 'text-green-500',
    bgColor: 'bg-green-500',
  },
  cancelled: {
    label: 'Cancelled',
    icon: CheckCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500',
  },
};

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatEstimatedDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function OrderTracking({ order }) {
  // Build status timeline from status_history
  const statusHistory = order.status_history || [];
  const currentStatus = order.status;

  // Create timeline steps
  const timelineSteps = [
    { status: 'placed', required: true },
    { status: 'confirmed', required: false },
    { status: 'processing', required: false },
    { status: 'shipped', required: false },
    { status: 'delivered', required: false },
  ];

  // Find completed steps with timestamps
  const completedSteps = timelineSteps.map(step => {
    const historyEntry = statusHistory.find(h => h.status === step.status);
    return {
      ...step,
      completed: !!historyEntry,
      timestamp: historyEntry?.timestamp,
      config: STATUS_CONFIG[step.status],
    };
  });

  // Find current step (first incomplete step)
  const currentStepIndex = completedSteps.findIndex(step => !step.completed);
  const isCancelled = currentStatus === 'cancelled';

  return (
    <div className="space-y-6">
      {/* Estimated Delivery Banner */}
      {order.estimated_delivery_date && currentStatus !== 'delivered' && currentStatus !== 'cancelled' && (
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-sm text-slate-400">Estimated Delivery</p>
              <p className="text-lg font-semibold text-white">
                {formatEstimatedDate(order.estimated_delivery_date)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Order Status</h3>

        <div className="space-y-6">
          {completedSteps.map((step, index) => {
            const Icon = step.config.icon;
            const isCompleted = step.completed;
            const isCurrent = index === currentStepIndex && !isCancelled;
            const isCancelledStep = isCancelled && step.status === 'cancelled';

            return (
              <div key={step.status} className="flex items-start gap-4">
                {/* Status Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted || isCancelledStep
                    ? 'bg-green-500/20 border-2 border-green-500'
                    : isCurrent
                    ? 'bg-cyan-500/20 border-2 border-cyan-500 animate-pulse'
                    : 'bg-slate-700 border-2 border-slate-600'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isCompleted || isCancelledStep
                      ? 'text-green-400'
                      : isCurrent
                      ? 'text-cyan-400'
                      : 'text-slate-500'
                  }`} />
                </div>

                {/* Status Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${
                      isCompleted || isCancelledStep
                        ? 'text-white'
                        : isCurrent
                        ? 'text-cyan-400'
                        : 'text-slate-400'
                    }`}>
                      {step.config.label}
                    </h4>

                    {(isCompleted || isCancelledStep) && step.timestamp && (
                      <span className="text-sm text-slate-400">
                        {formatDateTime(step.timestamp)}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-500 mt-1">
                    {isCompleted || isCancelledStep
                      ? 'Completed'
                      : isCurrent
                      ? 'In progress'
                      : 'Pending'
                    }
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-slate-800/50 rounded-xl p-4">
        <h4 className="font-medium text-white mb-3">Order Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Order Number:</span>
            <p className="text-white font-mono">{order.order_number}</p>
          </div>
          <div>
            <span className="text-slate-400">Order Date:</span>
            <p className="text-white">{formatDateTime(order.created_at)}</p>
          </div>
          <div>
            <span className="text-slate-400">Current Status:</span>
            <p className="text-white capitalize">{currentStatus}</p>
          </div>
          <div>
            <span className="text-slate-400">Total Amount:</span>
            <p className="text-white">₹{order.total}</p>
          </div>
        </div>
      </div>
    </div>
  );
}