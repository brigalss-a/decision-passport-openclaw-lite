const green = "\x1b[32m";
const yellow = "\x1b[33m";
const cyan = "\x1b[36m";
const reset = "\x1b[0m";

export function printDemoSummary(params: {
  session: string;
  records: number;
  verification: "PASS" | "FAIL";
}) {
  console.log(`${cyan}Session:${reset} ${params.session}`);
  console.log(`${cyan}Records:${reset} ${params.records}`);
  console.log(`${cyan}Bundle:${reset} ${green}EXPORTED${reset}`);
  console.log(`${cyan}Verification:${reset} ${params.verification === "PASS" ? green + "PASS" + reset : yellow + "FAIL" + reset}`);
}
