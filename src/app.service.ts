import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductList, AvailableProduct, SalesProduct } from './entities/product.entity';
import * as readline from 'readline';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);
  private mode: 'VENTAS' | 'REGISTRO' = 'VENTAS';

  constructor(
    @InjectRepository(ProductList) private listRepo: Repository<ProductList>,
    @InjectRepository(AvailableProduct) private availableRepo: Repository<AvailableProduct>,
    @InjectRepository(SalesProduct) private salesRepo: Repository<SalesProduct>,
  ) {}

  async onModuleInit() {
    await this.seedDatabase();
    this.startTerminalListener();
    this.setupSystemSignals();
  }

  // --- FUNCIÓN QUE TE FALTABA ---
  toggleMode(): string {
    this.mode = this.mode === 'VENTAS' ? 'REGISTRO' : 'VENTAS';
    const msg = `[CAMBIO] Modo actualizado a: ${this.mode}`;
    console.log(`\n${msg}\n`);
    return msg;
  }

  private setupSystemSignals() {
    // Esto permite cambiar el modo con: docker kill --signal=SIGUSR1 nest_backend
    process.on('SIGUSR1', () => {
      this.toggleMode();
    });
  }

  private startTerminalListener() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    console.log(`\n================================================`);
    console.log(`SISTEMA LISTO - MODO: ${this.mode}`);
    console.log(`- Escanea un código con el lector`);
    console.log(`- Cambia modo vía HTTP: http://localhost:3006/cambiar-modo`);
    console.log(`================================================\n`);

    rl.on('line', async (input) => {
      const data = input.trim();
      if (!data) return;

      if (data.toLowerCase() === 'm') {
        this.toggleMode();
      } else {
        await this.handleBarcode(data);
      }
    });
  }

  async handleBarcode(codigo: string) {
    try {
      if (this.mode === 'REGISTRO') {
        const productInList = await this.listRepo.findOneBy({ codigo });
        
        if (productInList) {
          let available = await this.availableRepo.findOneBy({ codigo });
          if (available) {
            available.stock += 1;
          } else {
            available = this.availableRepo.create({ 
              codigo, 
              nombre: productInList.nombre, 
              stock: 1 
            });
          }
          await this.availableRepo.save(available);
          console.log(`[OK - REGISTRO] ${productInList.nombre} | Nuevo Stock: ${available.stock}`);
        } else {
          console.error(`[ERROR] Código ${codigo} no existe en PRODUCT_LIST`);
        }

      } else {
        const available = await this.availableRepo.findOneBy({ codigo });
        
        if (available && available.stock > 0) {
          available.stock -= 1;
          await this.availableRepo.save(available);
          
          const sale = this.salesRepo.create({ codigo, nombre: available.nombre });
          await this.salesRepo.save(sale);
          
          console.log(`[OK - VENTA] ${available.nombre} | Restantes: ${available.stock}`);
        } else {
          console.error(`[ERROR] Sin stock o producto no registrado: ${codigo}`);
        }
      }
    } catch (error) {
      this.logger.error('Error procesando código', error);
    }
  }

  private async seedDatabase() {
    const count = await this.listRepo.count();
    if (count === 0) {
      await this.listRepo.save({ codigo: '01206726', nombre: 'prueba' });
      this.logger.log('Producto inicial "prueba" creado en la lista maestra.');
    }
  }
}