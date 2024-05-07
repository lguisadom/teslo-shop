import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductImage } from './entities';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource
  ) { }

  async create(createProductDto: CreateProductDto) {

    try {
      const { images = [], ...productDetails } = createProductDto;

      const product: Product = this.productRepository.create({
        ...productDetails,
        images: images.map(image => this.productImageRepository.create({ url: image }))
      });

      await this.productRepository.save(product);

      return { ...product, images };

    } catch (error: any) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto)/*: Promise<Product[]>*/ {
    const { limit = 10, offset = 0 } = paginationDto;
    const products: Product[] = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true
      }
    });

    return products.map(product => ({
      ...product,
      images: product.images.map(image => image.url)
    }));
  }

  async findOne(term: string)/*: Promise<Product>*/ {
    try {
      this.logger.log(`term=${term}`);
      let product: Product;

      if (isUUID(term)) {
        product = await this.productRepository.findOneBy({ id: term });

      } else {
        // product = await this.productRepository.findOneBy({ slug: term });
        const queryBuilder = this.productRepository.createQueryBuilder('prod');
        product = await queryBuilder
          .where('UPPER(title) = :title or slug = :slug', {
            title: term.toUpperCase(),
            slug: term.toLowerCase()
          })
          .leftJoinAndSelect('prod.images', 'prodImages')
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

  async findOnePlane(term: string) {
    const { images = [], ...rest } = await this.findOne(term);
    return {
      ...rest,
      images: images.map(image => image.url)
    }

    // El mismo código
    // const product: Product = await this.findOne(term);
    // return {
    //   ...product,
    //   images: product.images.map(image => image.url)
    // };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...toUpdate } = updateProductDto;

    const product: Product = await this.productRepository.preload({
      id: id,
      ...toUpdate
    });

    if (!product) {
      throw new NotFoundException(`Product with id=${id} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });

        product.images = images.map(
          image => this.productImageRepository.create({ url: image })
        );
      }

      await queryRunner.manager.save(product);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOnePlane(id);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
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

  async deleteAllProducts() {
    try {
      const queryBuilder = this.productRepository.createQueryBuilder('product');
      await queryBuilder
        .delete()
        .where({}) // delete all products
        .execute();

    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
}
