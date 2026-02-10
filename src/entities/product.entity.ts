import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity('product_list')
export class ProductList {
  @PrimaryColumn()
  codigo: string;

  @Column()
  nombre: string;
}

@Entity('available_products')
export class AvailableProduct {
  @PrimaryColumn()
  codigo: string;

  @Column()
  nombre: string;

  @Column({ default: 0 })
  stock: number;
}

@Entity('sales_products')
export class SalesProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  codigo: string;

  @Column()
  nombre: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_venta: Date;
}