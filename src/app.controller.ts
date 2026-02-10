import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('/') // Ponemos la barra explícita
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('cambiar-modo')
  getToggle() {
    return this.appService.toggleMode();
  }

  @Post('escanear')
async recibirEscaneo(@Body('codigo') codigo: string) {
  // Llamamos a la misma lógica que usábamos en la terminal
  return await this.appService.handleBarcode(codigo);
}
}