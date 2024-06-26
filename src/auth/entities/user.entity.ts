import { Product } from "src/products/entities";
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    name: "email",
    type: "text",
    unique: true
  })
  email: string;

  @Column({
    name: "password",
    type: "text",
    nullable: false,
    select: false
  })
  password: string;

  @Column("text", {
    name: "full_name",
    nullable: false
  })
  fullName: string;

  @Column("boolean", {
    name: "is_active",
    default: true
  })  
  isActive: boolean;

  @Column({
    name: "roles",
    type: "text",
    array: true,
    default: ["user"]
  })
  roles: string[];

  @OneToMany(
    () => Product,
    (product) => product.user
  )
  products: Product[];


  @BeforeInsert()
  checkFieldsBeforeInser() {
    this.email = this.email.toLowerCase().trim();
  }

  @BeforeUpdate()
  checkFieldsBeforeUpdate() {
    this.checkFieldsBeforeInser();
  }
}
