import { ConsoleLogger, Injectable } from "@nestjs/common";
import { AppLogger } from "./logger.interface";

@Injectable()
export class LoggerService extends ConsoleLogger implements AppLogger {}

