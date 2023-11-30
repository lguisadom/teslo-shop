import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) { }

  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);
      return product;

    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<Product[]> {
    const { limit = 10, offset = 0 } = paginationDto;
    return await this.productRepository.find({
      take: limit,
      skip: offset,
      // TODO: relations
    });
  }

  async findOne(term: string): Promise<Product> {
    try {
      this.logger.log(`term=${term}`);
      let product: Product;

      if (isUUID(term)) {
        product = await this.productRepository.findOneBy({ id: term });

      } else {
        // product = await this.productRepository.findOneBy({ slug: term });
        const queryBuilder = this.productRepository.createQueryBuilder();
        product = await queryBuilder
          .where('UPPER(title) = :title or slug = :slug', {
            title: term.toUpperCase(),
            slug: term.toLowerCase()
          })
          .getOne();
      }

      this.logger.log('product: ', { product });

      if (!product) {
        throw new NotFoundException(`Product with term=${term} not found`);
      }

      return product;

    } catch (error: any) {
      this.handleDBExceptions(error);
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      const product: Product = await this.productRepository.preload({
        id: id,
        ...updateProductDto
      });

      if (!product) {
        throw new NotFoundException(`Product with id=${id} not found`);
      }

      await this.productRepository.save(product);

      return product;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      this.logger.log(`Remove id=${id}`);
      const product: Product = await this.findOne(id);
      await this.productRepository.remove(product);

    } catch (error: any) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: any) {
    this.logger.error('error: ', { error });

    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    if (error instanceof NotFoundException) {
      throw error;
    }

    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
