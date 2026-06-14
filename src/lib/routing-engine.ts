export interface Transaction {
  tx_id: string;
  amount: number;
  arrival_time: number;
  max_delay: number;
  priority: number;
  risk_score: number;
}

export interface Channel {
  id: string;
  name: string;
  fee: number;
  capacity: number;
  latency: number;
  liquidity: number;
  running: number[];
  usedLiquidity: number;
}

export interface Assignment {
  tx_id: string;
  channel_id: string | null;
  channel_name: string | null;
  start_time: number | null;
  end_time: number | null;
  failed?: boolean;
  fail_reason?: string;
  delay_penalty: number;
  channel_fee: number;
  sla_penalty: number;
  risk_penalty: number;
  total_cost: number;
  amount: number;
  priority: number;
  risk_score: number;
}

export interface ChannelStat {
  count: number;
  total_fee: number;
  total_delay_penalty: number;
  total_sla_penalty: number;
  total_risk_penalty: number;
  utilization: number;
  liquidity_used: number;
}

export interface RoutingResult {
  assignments: Assignment[];
  total_system_cost_estimate: number;
  channel_stats: Record<string, ChannelStat>;
}

export interface SimulationOptions {
  congestionMode: boolean;
}

const P = 0.001;
const F = 0.5;
const SLA_PENALTY_RATE = 0.01;
const RISK_PENALTY_RATE = 0.005;

export const DEFAULT_CHANNELS: Channel[] = [
  { id: "Channel_F", name: "FAST", fee: 5.0, capacity: 2, latency: 1, liquidity: 50000, running: [], usedLiquidity: 0 },
  { id: "Channel_S", name: "STANDARD", fee: 1.0, capacity: 4, latency: 3, liquidity: 100000, running: [], usedLiquidity: 0 },
  { id: "Channel_B", name: "BULK", fee: 0.2, capacity: 10, latency: 10, liquidity: 500000, running: [], usedLiquidity: 0 },
];

const CHANNEL_NAMES: Record<string, string> = {
  Channel_F: "FAST",
  Channel_S: "STANDARD",
  Channel_B: "BULK",
};

export function parseCSV(text: string): Transaction[] {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(",").map(v => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = vals[i]));
    return {
      tx_id: obj["tx_id"] || "",
      amount: parseFloat(obj["amount"]) || 0,
      arrival_time: parseInt(obj["arrival_time"]) || 0,
      max_delay: parseInt(obj["max_delay"]) || 5,
      priority: parseInt(obj["priority"]) || 1,
      risk_score: parseFloat(obj["risk_score"]) || 0,
    };
  });
}

function getDynamicFee(baseFee: number, currentLoad: number, capacity: number): number {
  return baseFee * (1 + currentLoad / capacity);
}

function getSLAPenalty(priority: number, delay: number, amount: number): number {
  if (priority >= 3 && delay > 2) return SLA_PENALTY_RATE * amount * (delay - 2);
  if (priority >= 2 && delay > 5) return SLA_PENALTY_RATE * amount * (delay - 5);
  return 0;
}

function getRiskPenalty(riskScore: number, amount: number): number {
  if (riskScore > 0.7) return RISK_PENALTY_RATE * amount;
  if (riskScore > 0.4) return RISK_PENALTY_RATE * amount * 0.3;
  return 0;
}

export function runRouting(transactions: Transaction[], options?: SimulationOptions): RoutingResult {
  const congestion = options?.congestionMode ?? false;

  const channels: Record<string, Channel> = {};
  DEFAULT_CHANNELS.forEach(ch => {
    const latency = congestion && ch.id === "Channel_F" ? ch.latency * 2 : ch.latency;
    channels[ch.id] = { ...ch, latency, running: [], usedLiquidity: 0 };
  });

  const sorted = [...transactions].sort((a, b) => a.arrival_time - b.arrival_time || b.priority - a.priority);
  const assignments: Assignment[] = [];
  let totalCost = 0;
  const channelStats: Record<string, ChannelStat> = {};
  Object.keys(channels).forEach(id => {
    channelStats[id] = { count: 0, total_fee: 0, total_delay_penalty: 0, total_sla_penalty: 0, total_risk_penalty: 0, utilization: 0, liquidity_used: 0 };
  });

  for (const tx of sorted) {
    const arrival = tx.arrival_time;
    const deadline = arrival + tx.max_delay;
    let scheduled = false;

    for (let startTime = arrival; startTime <= deadline; startTime++) {
      // Free completed transactions
      for (const ch of Object.values(channels)) {
        ch.running = ch.running.filter(t => t > startTime);
      }

      // Find available channels respecting constraints
      const available: [string, Channel, number][] = [];
      for (const [cid, ch] of Object.entries(channels)) {
        if (ch.running.length >= ch.capacity) continue;
        // Risk rule: high risk cannot use BULK
        if (tx.risk_score > 0.7 && cid === "Channel_B") continue;
        // Regulatory rule: amount > 50000 cannot use BULK
        if (tx.amount > 50000 && cid === "Channel_B") continue;
        // Liquidity constraint
        if (ch.usedLiquidity + tx.amount > ch.liquidity) continue;

        const dynamicFee = getDynamicFee(ch.fee, ch.running.length, ch.capacity);
        available.push([cid, ch, dynamicFee]);
      }

      if (available.length > 0) {
        const [cid, chosen, dynamicFee] = available.reduce((a, b) => a[2] < b[2] ? a : b);
        const finish = startTime + chosen.latency;
        chosen.running.push(finish);
        chosen.usedLiquidity += tx.amount;

        const delay = startTime - arrival;
        const delayPenalty = P * tx.amount * delay;
        const slaPenalty = getSLAPenalty(tx.priority, delay, tx.amount);
        const riskPenalty = getRiskPenalty(tx.risk_score, tx.amount);
        const txCost = dynamicFee + delayPenalty + slaPenalty + riskPenalty;
        totalCost += txCost;

        channelStats[cid].count++;
        channelStats[cid].total_fee += dynamicFee;
        channelStats[cid].total_delay_penalty += delayPenalty;
        channelStats[cid].total_sla_penalty += slaPenalty;
        channelStats[cid].total_risk_penalty += riskPenalty;
        channelStats[cid].liquidity_used += tx.amount;

        assignments.push({
          tx_id: tx.tx_id,
          channel_id: cid,
          channel_name: CHANNEL_NAMES[cid] || cid,
          start_time: startTime,
          end_time: finish,
          delay_penalty: round2(delayPenalty),
          channel_fee: round2(dynamicFee),
          sla_penalty: round2(slaPenalty),
          risk_penalty: round2(riskPenalty),
          total_cost: round2(txCost),
          amount: tx.amount,
          priority: tx.priority,
          risk_score: tx.risk_score,
        });
        scheduled = true;
        break;
      }
    }

    if (!scheduled) {
      const failCost = F * tx.amount;
      totalCost += failCost;
      assignments.push({
        tx_id: tx.tx_id,
        channel_id: null,
        channel_name: null,
        start_time: null,
        end_time: null,
        failed: true,
        fail_reason: getFailReason(tx, channels),
        delay_penalty: 0,
        channel_fee: 0,
        sla_penalty: 0,
        risk_penalty: 0,
        total_cost: round2(failCost),
        amount: tx.amount,
        priority: tx.priority,
        risk_score: tx.risk_score,
      });
    }
  }

  // Calculate utilization
  for (const [id, ch] of Object.entries(channels)) {
    channelStats[id].utilization = channelStats[id].count > 0 ? Math.min(100, Math.round((channelStats[id].count / ch.capacity) * 100)) : 0;
    channelStats[id].liquidity_used = round2(channelStats[id].liquidity_used);
  }

  return { assignments, total_system_cost_estimate: round2(totalCost), channel_stats: channelStats };
}

function getFailReason(tx: Transaction, channels: Record<string, Channel>): string {
  if (tx.risk_score > 0.7 && tx.amount > 50000) return "High risk + amount exceeds BULK limit";
  if (tx.risk_score > 0.7) return "High risk – limited channels";
  if (tx.amount > 50000) return "Amount exceeds BULK limit";
  return "All channels at capacity";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
